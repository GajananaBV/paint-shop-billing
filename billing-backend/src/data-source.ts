import "reflect-metadata";
import { DataSource } from "typeorm";
import { Product } from "./entity/Product";
import { Bill } from "./entity/Bill";
import { BillItem } from "./entity/BillItem";
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