import { ApiProperty } from "@nestjs/swagger";
import type { CoreDashboardSummaryContract, CoreTableSummaryContract } from "@pong-ping/contracts";
import { GameRecordResponseDto } from "../../../competition/presentation/http/dtos/competition-command.dtos";
import { RatingReadDto } from "../../../rating/presentation/http/dtos/rating-read.dtos";
import { TableResponseDto } from "../../../table/presentation/http/dtos/table-command.dtos";

export class CoreTableSummaryDto implements CoreTableSummaryContract {
  @ApiProperty({ example: 4 })
  totalTables!: number;

  @ApiProperty({ example: 2 })
  activeTables!: number;

  @ApiProperty({ example: 8 })
  queuedAthletes!: number;

  @ApiProperty({ type: [TableResponseDto] })
  tables!: TableResponseDto[];
}

export class CoreDashboardSummaryDto implements CoreDashboardSummaryContract {
  @ApiProperty({ type: CoreTableSummaryDto })
  tables!: CoreTableSummaryDto;

  @ApiProperty({ example: 12 })
  activeAthleteCount!: number;

  @ApiProperty({ type: [GameRecordResponseDto] })
  recentGames!: GameRecordResponseDto[];

  @ApiProperty({ type: [RatingReadDto] })
  ranking!: RatingReadDto[];
}
