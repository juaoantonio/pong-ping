import { Module } from "@nestjs/common";
import { WinstonModule, utilities as nestWinstonUtilities } from "nest-winston";
import winston from "winston";
import { TypeOrmWinstonLogger } from "./typeorm-winston.logger";

const isProduction = process.env.NODE_ENV === "production";

const consoleFormat = isProduction
  ? winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    )
  : winston.format.combine(
      winston.format.timestamp({ format: "HH:mm:ss" }),
      winston.format.errors({ stack: true }),
      winston.format.ms(),
      nestWinstonUtilities.format.nestLike("PongPingApi", {
        colors: true,
        prettyPrint: true,
      }),
    );

@Module({
  imports: [
    WinstonModule.forRoot({
      level: isProduction ? "info" : "debug",
      defaultMeta: { service: "api" },
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
    }),
  ],
  providers: [TypeOrmWinstonLogger],
  exports: [TypeOrmWinstonLogger],
})
export class LoggingModule {}
