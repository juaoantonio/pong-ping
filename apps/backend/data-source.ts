import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import { entities } from "./src/entities";

config();

export default new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities,
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
});
