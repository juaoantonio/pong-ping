import { ApiProperty } from "@nestjs/swagger";

export class HealthCheckDto {
  @ApiProperty({ example: "ok" })
  status!: "ok" | "error";

  @ApiProperty({ example: 12 })
  latencyMs!: number;
}

export class HealthResponseDto {
  @ApiProperty({ example: "api" })
  service!: string;

  @ApiProperty({ example: "0.1.0" })
  version!: string;

  @ApiProperty({ example: "ok" })
  status!: "ok" | "error";

  @ApiProperty({ type: HealthCheckDto })
  database!: HealthCheckDto;
}
