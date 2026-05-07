import { ApiProperty } from "@nestjs/swagger";

export class HealthCheckDto {
  @ApiProperty({ example: "healthy" })
  status!: "healthy" | "down";

  @ApiProperty({ example: "postgres" })
  engine!: "postgres";

  @ApiProperty({ example: "16.3" })
  version!: string;

  @ApiProperty({ example: 100 })
  max_connections!: number;

  @ApiProperty({ example: 3 })
  opened_connections!: number;

  @ApiProperty({ example: 12 })
  latency_ms!: number;
}

export class HealthResponseDto {
  @ApiProperty({ example: "healthy" })
  status!: "healthy" | "unhealthy";

  @ApiProperty({ example: "2026-05-07T20:00:00.000Z" })
  updated_at!: string;

  @ApiProperty()
  application!: {
    version: string;
    uptime_seconds: number;
    environment: string;
  };

  @ApiProperty()
  dependencies!: {
    database: HealthCheckDto;
  };
}
