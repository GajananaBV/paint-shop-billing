import PDFDocument from "pdfkit";
import fs from "fs";
import { Bill } from "../entity/Bill";

export const generateInvoicePdf = (bill: Bill, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header
      doc
        .fontSize(20)
        .text("Paint Shop Billing", { align: "center" })
        .moveDown();

      doc.fontSize(12).text(`Bill ID: ${bill.id}`);
      doc.text(`Customer: ${bill.customerName}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Table Header
      doc.fontSize(12).text("Product       Qty   Rate   GST%   Line Total", { underline: true });
      doc.moveDown(0.5);

      // Items
      bill.items.forEach((item: any) => {
        const line = `${item.productCode.padEnd(12)} ${item.quantity
          .toString()
          .padEnd(5)} ${item.rate.toFixed(2).padEnd(6)} ${item.gstPerc
          .toString()
          .padEnd(5)} ${item.lineTotal.toFixed(2)}`;
        doc.text(line);
      });

      doc.moveDown();

     doc.text(`Subtotal: ₹${bill.subtotal.toFixed(2)}`);
doc.text(`GST: ₹${bill.gstAmount.toFixed(2)}`);
doc.text(`Discount: ₹${bill.discount.toFixed(2)}`);
doc.moveDown();
doc.font("Helvetica-Bold").fontSize(14).text(`Net Amount: ₹${bill.netAmount.toFixed(2)}`);
doc.font("Helvetica").fontSize(12); // reset font

      writeStream.on("finish", () => resolve());
      writeStream.on("error", (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};
