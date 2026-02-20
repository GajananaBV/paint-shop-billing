import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { BillItem } from "./BillItem";

@Entity()
export class Bill {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  customerName!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  subtotal!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  gstAmount!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  discount!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  netAmount!: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @OneToMany(() => BillItem, (item) => item.bill, { cascade: true, eager: true })
  items!: BillItem[];
  customer: any;
}
