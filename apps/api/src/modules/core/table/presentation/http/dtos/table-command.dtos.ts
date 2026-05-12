import { ApiProperty } from "@nestjs/swagger";
import { ArrayNotEmpty, IsArray, IsIn, IsString, Length } from "class-validator";
import {
  CORE_PLAY_MODE_CONTRACT,
  type ActiveGameResponseContract,
  type AthleteIdListRequestContract,
  type CreateTableRequestContract,
  type GameSideResponseContract,
  type ISODateString,
  type QueueEntryResponseContract,
  type RenameTableRequestContract,
  type TableActiveGameCommandResponseContract,
  type TableMemberResponseContract,
  type TableQueueEntryCommandResponseContract,
  type TableResponseContract,
  type WinningAthletesRequestContract,
} from "@pong-ping/contracts";

const PLAY_MODES = Object.values(CORE_PLAY_MODE_CONTRACT);

export class CreateTableRequestDto implements CreateTableRequestContract {
  @ApiProperty({ example: "Mesa 1", minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiProperty({ enum: PLAY_MODES, example: "singles" })
  @IsIn(PLAY_MODES)
  playMode!: CreateTableRequestContract["playMode"];
}

export class RenameTableRequestDto implements RenameTableRequestContract {
  @ApiProperty({ example: "Mesa Central", minLength: 2, maxLength: 80 })
  @IsString()
  @Length(2, 80)
  name!: string;
}

export class AthleteIdListRequestDto implements AthleteIdListRequestContract {
  @ApiProperty({ type: [String], example: ["athlete-1"] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  athleteIds!: string[];
}

export class WinningAthletesRequestDto implements WinningAthletesRequestContract {
  @ApiProperty({ type: [String], example: ["athlete-1"] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  winningAthleteIds!: string[];
}

export class TableMemberResponseDto implements TableMemberResponseContract {
  @ApiProperty({ example: "athlete-1" })
  athleteId!: string;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  joinedAt!: ISODateString;
}

export class QueueEntryResponseDto implements QueueEntryResponseContract {
  @ApiProperty({ example: "athlete-1" })
  athleteId!: string;

  @ApiProperty({ example: 0 })
  position!: number;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  joinedAt!: ISODateString;
}

export class GameSideResponseDto implements GameSideResponseContract {
  @ApiProperty({ type: [String], example: ["athlete-1"] })
  athleteIds!: string[];
}

export class ActiveGameResponseDto implements ActiveGameResponseContract {
  @ApiProperty({ enum: PLAY_MODES, example: "singles" })
  playMode!: ActiveGameResponseContract["playMode"];

  @ApiProperty({ type: GameSideResponseDto })
  firstSide!: GameSideResponseDto;

  @ApiProperty({ type: GameSideResponseDto })
  secondSide!: GameSideResponseDto;
}

export class TableResponseDto implements TableResponseContract {
  @ApiProperty({ example: "table-1" })
  id!: string;

  @ApiProperty({ example: "club-1" })
  clubId!: string;

  @ApiProperty({ example: "Mesa 1" })
  name!: string;

  @ApiProperty({ enum: PLAY_MODES, example: "singles" })
  playMode!: TableResponseContract["playMode"];

  @ApiProperty({ example: "athlete-creator" })
  createdByAthleteId!: string;

  @ApiProperty({ type: String, format: "date-time", example: "2026-05-08T20:00:00.000Z" })
  createdAt!: ISODateString;

  @ApiProperty({ type: [TableMemberResponseDto] })
  members!: TableMemberResponseDto[];

  @ApiProperty({ type: [QueueEntryResponseDto] })
  queue!: QueueEntryResponseDto[];

  @ApiProperty({ type: ActiveGameResponseDto, nullable: true })
  activeGame!: ActiveGameResponseDto | null;
}

export class TableQueueEntryCommandResponseDto implements TableQueueEntryCommandResponseContract {
  @ApiProperty({ type: TableResponseDto })
  table!: TableResponseDto;

  @ApiProperty({ type: QueueEntryResponseDto })
  queueEntry!: QueueEntryResponseDto;

  @ApiProperty({ required: false, example: true })
  membershipCreated?: boolean;
}

export class TableActiveGameCommandResponseDto implements TableActiveGameCommandResponseContract {
  @ApiProperty({ type: TableResponseDto })
  table!: TableResponseDto;

  @ApiProperty({ type: ActiveGameResponseDto })
  activeGame!: ActiveGameResponseDto;
}
