import type {
  ISODateString,
  InvitationExpiryPresetDto,
  MatchHistoryKindDto,
  OkResponseDataDto,
  PaginationDataDto,
  RankingDto,
  UserIdentityDto,
  UserOptionDto,
} from "./shared.js";

export interface TableIdParamsDto {
  tableId: string;
}

export interface CreateTableRequestDto {
  name: string;
}

export interface CreatedTableDto {
  id: string;
  name: string;
}

export interface CreateTableResponseDataDto {
  table: CreatedTableDto;
}

export interface DeleteTableResponseDataDto {
  message: string;
}

export interface TableInvitationRequestDto {
  expiresIn?: InvitationExpiryPresetDto;
  oneTimeUse?: boolean;
}

export interface TableInvitationDto {
  id: string;
  expiresAt: ISODateString;
  oneTimeUse: boolean;
  token: string;
}

export interface CreateTableInvitationResponseDataDto {
  invite: TableInvitationDto;
}

export interface AddTableParticipantRequestDto {
  userId: string;
}

export interface TableParticipantDto {
  id: string;
  tableId: string;
  userId: string;
  queuePosition: number;
  joinedAt: ISODateString;
}

export interface QueueTableResponseDataDto {
  ok: true;
  participant: TableParticipantDto;
}

export interface ParticipantParamsDto extends TableIdParamsDto {
  participantId: string;
}

export interface MatchParamsDto extends TableIdParamsDto {
  matchId: string;
}

export interface JoinTableByTokenParamsDto {
  token: string;
}

export interface JoinTableByTokenResponseDataDto {
  ok: true;
  tableId: string;
}

export interface TableMatchDto {
  id: string;
  kind: MatchHistoryKindDto;
  rollbackOfId: string | null;
  rolledBack: boolean;
  createdAt: ISODateString;
  winnerOldElo: number;
  winnerNewElo: number;
  winnerDiffPoints: number;
  loserOldElo: number;
  loserNewElo: number;
  loserDiffPoints: number;
  winner: UserIdentityDto;
  loser: UserIdentityDto;
}

export interface TableListItemDto {
  id: string;
  name: string;
  createdAt: ISODateString;
  createdBy: UserIdentityDto;
  participantCount: number;
  currentPlayers: UserIdentityDto[];
  latestMatch: TableMatchDto | null;
}

export interface ListTablesResponseDataDto {
  pageInfo: PaginationDataDto;
  tables: TableListItemDto[];
}

export interface TableDetailParticipantDto {
  id: string;
  queuePosition: number;
  joinedAt: ISODateString;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    playerRanking: RankingDto | null;
  };
}

export interface TableMemberDto {
  joinedAt: ISODateString;
  user: UserOptionDto;
}

export interface TableSummaryDto {
  id: string;
  name: string;
  createdAt: ISODateString;
  createdBy: {
    name: string | null;
    email: string | null;
  };
  currentInvitation: TableInvitationDto | null;
  participants: TableDetailParticipantDto[];
  members: TableMemberDto[];
  viewerIsMember: boolean;
  viewerIsQueued: boolean;
  viewerIsPlaying: boolean;
  viewerQueuePosition: number | null;
  viewerUserId: string;
  recentMatches: TableMatchDto[];
}

export interface TableDetailResponseDataDto {
  table: TableSummaryDto | null;
}

export type LeaveTableQueueResponseDataDto = OkResponseDataDto;
export type LeaveTableSeatResponseDataDto = OkResponseDataDto;
