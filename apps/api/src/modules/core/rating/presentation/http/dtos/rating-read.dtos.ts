import { ApiProperty } from "@nestjs/swagger";
import type { RatingReadContract } from "@pong-ping/contracts";

export class RatingReadDto implements RatingReadContract {
  @ApiProperty({ example: "athlete-1" })
  athleteId!: string;

  @ApiProperty({ example: "Nico Pong" })
  athleteDisplayName!: string;

  @ApiProperty({ example: 1032 })
  points!: number;

  @ApiProperty({ example: 8 })
  wins!: number;

  @ApiProperty({ example: 12 })
  totalMatches!: number;

  @ApiProperty({ example: 66.67 })
  winRate!: number;

  @ApiProperty({ example: null, nullable: true })
  tier!: string | null;
}
