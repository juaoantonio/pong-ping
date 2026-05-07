export type ISODateString = string;

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data: T;
  meta: {
    requestId?: string;
    timestamp: ISODateString;
  };
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    status: number;
    code: string;
    message: string;
    details: unknown[];
    path: string;
    method: string;
    requestId?: string;
    timestamp: ISODateString;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type EmptyParams = Record<string, never>;
export type EmptyQuery = Record<string, never>;
export type EmptyBody = Record<string, never>;

export type RoleDto = "superadmin" | "admin" | "user";
export type MatchHistoryKindDto = "match" | "rollback";
export type InvitationExpiryPresetDto = "15m" | "1h" | "1d" | "7d";

export type PageSizeDto = 10 | 25 | 50 | 100;

export interface PaginationQueryDto {
  page?: string;
  pageSize?: string;
}

export interface PaginationDataDto {
  page: number;
  pageSize: PageSizeDto;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UserIdentityDto {
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
}

export interface UserOptionDto {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface RankingDto {
  elo: number;
  wins: number;
  total_matches: number;
  winRate: number;
}

export interface OkResponseDataDto {
  ok: true;
}
