import { Module } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import winston from "winston";
import { TypeOrmWinstonLogger } from "./typeorm-winston.logger";

@Module({
  imports: [
    WinstonModule.forRoot({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      defaultMeta: { service: "api" },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
        }),
      ],
    }),
  ],
  providers: [TypeOrmWinstonLogger],
  exports: [TypeOrmWinstonLogger],
})
export class LoggingModule {}
