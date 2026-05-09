import { ApiProperty } from "@nestjs/swagger";

export class HealthDependencyResponseDto {
  @ApiProperty({ enum: ["healthy", "down"], example: "healthy" })
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

export class HealthApplicationResponseDto {
  @ApiProperty({ example: "0.1.0" })
  version!: string;

  @ApiProperty({ example: 123.45 })
  uptime_seconds!: number;

  @ApiProperty({ example: "development" })
  environment!: string;
}

export class HealthDependenciesResponseDto {
  @ApiProperty({ type: HealthDependencyResponseDto })
  database!: HealthDependencyResponseDto;
}

export class HealthResponseDto {
  @ApiProperty({ enum: ["healthy", "unhealthy"], example: "healthy" })
  status!: "healthy" | "unhealthy";

  @ApiProperty({ example: "2026-05-07T20:00:00.000Z" })
  updated_at!: string;

  @ApiProperty({ type: HealthApplicationResponseDto })
  application!: HealthApplicationResponseDto;

  @ApiProperty({ type: HealthDependenciesResponseDto })
  dependencies!: HealthDependenciesResponseDto;
}
