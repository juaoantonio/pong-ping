import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";

config({ path: `envs/.env.${process.env.NODE_ENV ?? "development"}` });
config({ path: "envs/.env" });

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "postgres",
  database: process.env.DB_DATABASE ?? "pong_ping_api",
  entities: ["src/**/*.entity.ts"],
  migrations: ["src/database/migrations/**/*{.ts,.js}"],
  synchronize: false,
  logging: process.env.DB_LOGGING === "true",
});
