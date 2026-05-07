import type { PaginationDataDto, RankingDto } from "./shared.js";

export interface RankLevelDto {
  name: string;
  minElo: number;
  iconImgKey?: string;
}

export interface PublicRankingUserDto {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  ranking: RankingDto;
  rankLevel: RankLevelDto | null;
  rankIconExists: boolean;
}

export interface PublicRankingsResponseDataDto {
  pageInfo: PaginationDataDto;
  rankings: PublicRankingUserDto[];
}
