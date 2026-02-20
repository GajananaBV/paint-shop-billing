import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  openingStock!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  purchases!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  sales!: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  rate!: number;

  @Column("decimal", { precision: 5, scale: 2, default: 0 })
  gstPerc!: number;
  stock!: number;
  price: any;

  // Calculate closing stock as a method
  getClosingStock(): number {
    return Number(this.openingStock) + Number(this.purchases) - Number(this.sales);
  }
}