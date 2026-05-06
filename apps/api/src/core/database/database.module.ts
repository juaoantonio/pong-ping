import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import type { ConfigSchema } from "../config/config.module";
import { LoggingModule } from "../logging/logging.module";
import { TypeOrmWinstonLogger } from "../logging/typeorm-winston.logger";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [LoggingModule],
      inject: [ConfigService, TypeOrmWinstonLogger],
      useFactory: (config: ConfigService<ConfigSchema>, logger: TypeOrmWinstonLogger) => ({
        type: "postgres",
        host: config.getOrThrow<string>("DB_HOST"),
        port: config.getOrThrow<number>("DB_PORT"),
        username: config.getOrThrow<string>("DB_USERNAME"),
        password: config.getOrThrow<string>("DB_PASSWORD"),
        database: config.getOrThrow<string>("DB_DATABASE"),
        autoLoadEntities: true,
        synchronize: config.getOrThrow<boolean>("DB_SYNCHRONIZE"),
        logging: config.getOrThrow<boolean>("DB_LOGGING"),
        logger,
      }),
    }),
  ],
})
export class DatabaseModule {}
