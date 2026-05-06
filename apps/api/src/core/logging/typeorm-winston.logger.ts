import { Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import type { Logger, QueryRunner } from "typeorm";
import type winston from "winston";

@Injectable()
export class TypeOrmWinstonLogger implements Logger {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger) {}

  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    this.logger.debug("database query", { query, parameters });
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: unknown[],
    _queryRunner?: QueryRunner,
  ) {
    this.logger.error("database query failed", { error, query, parameters });
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _queryRunner?: QueryRunner) {
    this.logger.warn("slow database query", { time, query, parameters });
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    this.logger.debug(message);
  }

  logMigration(message: string, _queryRunner?: QueryRunner) {
    this.logger.info(message);
  }

  log(level: "log" | "info" | "warn", message: unknown, _queryRunner?: QueryRunner) {
    this.logger.log(level === "log" ? "info" : level, String(message));
  }
}
