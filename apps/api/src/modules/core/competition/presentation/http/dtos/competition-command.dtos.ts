import { ApiProperty } from "@nestjs/swagger";
import {
  type GameRecordResponseContract,
  type GameSideResponseContract,
  type ISODateString,
  type RatingDeltaResponseContract,
  type SideRatingChangeResponseContract,
} from "@pong-ping/contracts";
import { GameSideResponseDto } from "../../../../table/presentation/http/dtos/table-command.dtos";

export class RatingDeltaResponseDto implements RatingDeltaResponseContract {
  @ApiProperty({ example: "athlete-1" })
  athleteId!: string;

  @ApiProperty({
    example: { points: 32, wins: 1, totalMatches: 1 },
  })
  delta!: RatingDeltaResponseContract["delta"];
}

export class SideRatingChangeResponseDto implements SideRatingChangeResponseContract {
  @ApiProperty({ type: GameSideResponseDto })
  side!: GameSideResponseContract;

  @ApiProperty({ type: [RatingDeltaResponseDto] })
  changes!: RatingDeltaResponseDto[];
}

export class GameRecordResponseDto implements GameRecordResponseContract {
  @ApiProperty({ example: "game-1" })
  id!: string;

  @ApiProperty({ example: "club-1" })
  clubId!: string;

  @ApiProperty({ example: "table-1" })
  tableId!: string;

  @ApiProperty({ type: GameSideResponseDto })
  winningSide!: GameSideResponseContract;

  @ApiProperty({ type: GameSideResponseDto })
  losingSide!: GameSideResponseContract;

  @ApiProperty({ type: [SideRatingChangeResponseDto] })
  ratingChanges!: SideRatingChangeResponseDto[];

  @ApiProperty({ example: "athlete-actor" })
  actorAthleteId!: string;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  finishedAt!: ISODateString;

  @ApiProperty({ nullable: true, example: null })
  originalRecordId!: string | null;

  @ApiProperty({ nullable: true, example: null })
  correctionId!: string | null;

  @ApiProperty({ example: false })
  isCorrection!: boolean;
}
