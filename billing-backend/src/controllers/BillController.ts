import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Bill } from "./../entity/Bill";
import { BillItem } from "../entity/BillItem";
import { Product } from "../entity/Product";

export const createBill = async (req: Request, res: Response) => {
  try {
    const { customer, items } = req.body; // items = [{ productId, quantity }]

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in the bill." });
    }

    const bill = new Bill();
    bill.customer = customer;
    bill.items = [];

    for (const item of items) {
      const product = await AppDataSource.getRepository(Product).findOneBy({ id: item.productId });

      if (!product) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
      }

      // Handle insufficient stock gracefully
      if (product.stock <= 0) {
        // Skip this item and notify user in response
        continue; // just skip items with 0 stock
      }

      if (item.quantity > product.stock) {
        item.quantity = product.stock; // limit quantity to available stock
      }

      const billItem = new BillItem();
      billItem.product = product;
      billItem.quantity = item.quantity;
      billItem.price = product.price;

      bill.items.push(billItem);

      // Reduce stock
      product.stock -= item.quantity;
      await AppDataSource.getRepository(Product).save(product);
    }

    if (bill.items.length === 0) {
      return res.status(400).json({ message: "All items have 0 stock. Cannot create bill." });
    }

    await AppDataSource.getRepository(Bill).save(bill);

    return res.status(201).json({ message: "Bill created successfully!", bill });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong", error });
  }
};
