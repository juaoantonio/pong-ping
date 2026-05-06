import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { DataSource } from "typeorm";
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
  @ApiOkResponse({ type: HealthResponseDto })
  async check(): Promise<HealthResponseDto> {
    const startedAt = Date.now();
    await this.dataSource.query("SELECT 1");
    const databaseLatencyMs = Date.now() - startedAt;

    return {
      service: "api",
      version: this.config.getOrThrow<string>("VERSION"),
      status: "ok",
      database: {
        status: "ok",
        latencyMs: databaseLatencyMs,
      },
    };
  }
}
