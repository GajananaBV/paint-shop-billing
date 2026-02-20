import "reflect-metadata";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { DataSource } from "typeorm";
import { Product } from "./entity/Product";
import { Bill } from "./entity/Bill";
import { BillItem } from "./entity/BillItem";
import { generateInvoicePdf } from "./utils/pdfInvoice";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "admin",
  database: process.env.DB_NAME || "paint_billing",
  synchronize: true,
  logging: false,
  entities: [Product, Bill, BillItem],
  migrations: [],
  subscribers: [],
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create invoices directory if missing
const invoicesDir = path.join(__dirname, "../public/invoices");
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

app.use("/invoices", express.static(invoicesDir));

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "Paint Billing Backend is running" });
});

// Product Routes
app.get("/api/products", async (req, res) => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const products = await productRepo.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Error fetching products" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const existing = await productRepo.findOneBy({ code: req.body.code });

    if (existing) {
      return res.status(400).json({ error: "Product code already exists" });
    }

    const product = productRepo.create(req.body);
    const savedProduct = await productRepo.save(product);
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ error: "Error creating product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOneBy({
      id: parseInt(req.params.id),
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    Object.assign(product, req.body);
    const updatedProduct = await productRepo.save(product);
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: "Error updating product" });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const productRepo = AppDataSource.getRepository(Product);
    const product = await productRepo.findOneBy({
      id: parseInt(req.params.id),
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await productRepo.remove(product);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting product" });
  }
});

// Bill Routes
app.get("/api/bills", async (req, res) => {
  try {
    const billRepo = AppDataSource.getRepository(Bill);
    const bills = await billRepo.find({ relations: ["items"] });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: "Error fetching bills" });
  }
});

app.post("/api/bills", async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { customerName, items, discount = 0 } = req.body;

    if (!customerName || !items || items.length === 0) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ error: "Customer name and items are required" });
    }

    const productRepo = queryRunner.manager.getRepository(Product);
    const billRepo = queryRunner.manager.getRepository(Bill);
    const billItemRepo = queryRunner.manager.getRepository(BillItem);

    let subtotal = 0;
    let gstAmount = 0;

    // First, check all products for sufficient stock
    for (const item of items) {
      const product = await productRepo.findOne({ 
        where: { code: item.productCode },
        lock: { mode: "pessimistic_write" }
      });
      
      if (!product) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({ 
          error: `Product ${item.productCode} not found` 
        });
      }

      const availableStock = product.getClosingStock();
      const requestedQuantity = Number(item.quantity);
      
      if (availableStock < requestedQuantity) {
        await queryRunner.rollbackTransaction();
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${availableStock.toFixed(2)}`
        });
      }
    }

    // Now process each item and update stock
    for (const item of items) {
      const product = await productRepo.findOne({ 
        where: { code: item.productCode },
        lock: { mode: "pessimistic_write" }
      });

      if (!product) continue; // Should not happen due to previous check

      // Update product stock
      const requestedQuantity = Number(item.quantity);
      product.sales = Number(product.sales) + requestedQuantity;
      await productRepo.save(product);

      // Calculate item totals with proper number conversion
      const rate = Number(item.rate);
      const quantity = Number(item.quantity);
      const discountPerc = Number(item.discountPerc) || 0;
      const gstPerc = Number(item.gstPerc) || 18; // Default to 18% if not provided

      const baseAmount = rate * quantity;
      const discountAmount = baseAmount * (discountPerc / 100);
      const taxableAmount = baseAmount - discountAmount;
      const itemGst = taxableAmount * (gstPerc / 100);

      item.lineTotal = taxableAmount + itemGst;
      subtotal += taxableAmount;
      gstAmount += itemGst;
    }

    const overallDiscountAmount = subtotal * (Number(discount) / 100);
    const netAmount = subtotal - overallDiscountAmount + gstAmount;

    // Create bill
    const bill = billRepo.create({
      customerName: customerName.trim(),
      subtotal,
      gstAmount,
      discount: overallDiscountAmount,
      netAmount,
      items: items.map((item: any) => billItemRepo.create({
        productCode: item.productCode,
        productName: item.productName,
        rate: Number(item.rate),
        quantity: Number(item.quantity),
        discountPerc: Number(item.discountPerc) || 0,
        gstPerc: Number(item.gstPerc) || 18,
        lineTotal: Number(item.lineTotal)
      })),
    });

    const savedBill = await billRepo.save(bill);
    await queryRunner.commitTransaction();

    // Generate PDF outside transaction
    const invoiceFileName = `invoice_${savedBill.id}.pdf`;
    const invoicePath = path.join(invoicesDir, invoiceFileName);
    await generateInvoicePdf(savedBill, invoicePath);

    res.status(201).json({
      ...savedBill,
      invoiceUrl: `/invoices/${invoiceFileName}`,
    });

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error creating bill:", error);
    res.status(500).json({ error: "Error creating bill" });
  } finally {
    await queryRunner.release();
  }
});
// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
