import type {
  ISODateString,
  MatchHistoryKindDto,
  PaginationDataDto,
  PaginationQueryDto,
} from "./shared.js";

export interface FinishMatchRequestDto {
  winnerParticipantId: string;
}

export interface FinishedMatchDto {
  id: string;
  winnerId: string;
  loserId: string;
  winnerNewElo: number;
  loserNewElo: number;
}

export interface FinishMatchResponseDataDto {
  match: FinishedMatchDto;
}

export interface RollbackMatchDto {
  id: string;
  rollbackOfId: string | null;
  winnerId: string;
  loserId: string;
  winnerNewElo: number;
  loserNewElo: number;
}

export interface RollbackMatchResponseDataDto {
  rollback: RollbackMatchDto;
}

export interface RoundParamsDto {
  roundId: string;
}

export interface AdminRoundsQueryDto extends PaginationQueryDto {
  q?: string;
  tableId?: string;
  player?: string;
  createdBy?: string;
  kind?: "all" | MatchHistoryKindDto;
  status?: "all" | "rolled_back" | "rollback_available" | "rollback_record";
  from?: string;
  to?: string;
}

export interface AdminRoundDto {
  id: string;
  tableId: string | null;
  rollbackOfId: string | null;
  rolledBack: boolean;
  kind: MatchHistoryKindDto;
  winnerOldElo: number;
  winnerNewElo: number;
  winnerDiffPoints: number;
  loserOldElo: number;
  loserNewElo: number;
  loserDiffPoints: number;
  createdAt: ISODateString;
  tableName: string | null;
  winner: {
    name: string | null;
    email: string | null;
  };
  loser: {
    name: string | null;
    email: string | null;
  };
  createdBy: {
    name: string | null;
    email: string | null;
  };
}

export interface ListAdminRoundsResponseDataDto {
  pageInfo: PaginationDataDto;
  rounds: AdminRoundDto[];
}
