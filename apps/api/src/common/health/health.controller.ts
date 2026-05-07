import { Controller, Get, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { DataSource } from "typeorm";
import { Public } from "../../modules/identity/authorization/authorization.decorators";
import type { ConfigSchema } from "../config/config.module";
import { HealthResponseDto } from "./dtos/health-response.dto";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService<ConfigSchema>,
  ) {}

  @Get()
  @Public()
  @ApiOkResponse({ type: HealthResponseDto })
  async check(@Res() response: Response): Promise<void> {
    const startedAt = Date.now();
    const base = {
      updated_at: new Date().toISOString(),
      application: {
        version: this.config.getOrThrow<string>("VERSION"),
        uptime_seconds: process.uptime(),
        environment: this.config.getOrThrow<string>("NODE_ENV"),
      },
    };

    try {
      if (!this.dataSource.isInitialized) {
        throw new Error("Database connection is not initialized.");
      }

      const [database] = (await this.dataSource.query(`
        SELECT
          split_part(current_setting('server_version'), ' ', 1) AS version,
          current_setting('max_connections')::int AS max_connections,
          (
            SELECT count(*)::int
            FROM pg_stat_activity
            WHERE datname = current_database()
          ) AS opened_connections
      `)) as Array<{
        version: string;
        max_connections: number;
        opened_connections: number;
      }>;

      response.status(200).json({
        ...base,
        status: "healthy",
        dependencies: {
          database: {
            status: "healthy",
            engine: "postgres",
            version: database.version,
            max_connections: Number(database.max_connections),
            opened_connections: Number(database.opened_connections),
            latency_ms: Date.now() - startedAt,
          },
        },
      } satisfies HealthResponseDto);
    } catch {
      response.status(503).json({
        ...base,
        status: "unhealthy",
        dependencies: {
          database: {
            status: "down",
            engine: "postgres",
            version: "unknown",
            max_connections: 0,
            opened_connections: 0,
            latency_ms: Date.now() - startedAt,
          },
        },
      } satisfies HealthResponseDto);
    }
  }
}
