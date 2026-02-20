import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Bill } from "./Bill";

@Entity()
export class BillItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Bill, (bill) => bill.items)
  bill!: Bill;

  @Column()
  productCode!: string;

  @Column()
  productName!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  rate!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity!: number;

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  discountPerc!: number;

  @Column("decimal", { precision: 5, scale: 2 })
  gstPerc!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  lineTotal!: number;
  product!: import("c:/Users/GajananVilasBhange/BILLING_APP/billing-backend/src/entity/Product").Product;
  price: any;
}
