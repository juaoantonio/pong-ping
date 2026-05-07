import type { AuthMeResponseDataDto } from "./auth.js";
import type { ISODateString } from "./shared.js";

export type AthleteTechnicalLevelDto =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "competitive";
export type AthleteGripStyleDto = "classic" | "penhold";
export type AthletePlayingStyleDto = "offensive" | "defensive" | "all_round";

export interface UpdateProfileRequestDto {
  name: string;
  technicalLevel?: AthleteTechnicalLevelDto | null;
  gripStyle?: AthleteGripStyleDto | null;
  playingStyle?: AthletePlayingStyleDto | null;
  bladeName?: string | null;
  forehandRubberName?: string | null;
  backhandRubberName?: string | null;
  equipmentNotes?: string | null;
}

export type UpdateProfileResponseDataDto = AuthMeResponseDataDto;

export interface AthleteEditableProfileDto {
  name: string | null;
  technicalLevel: AthleteTechnicalLevelDto | null;
  gripStyle: AthleteGripStyleDto | null;
  playingStyle: AthletePlayingStyleDto | null;
  bladeName: string | null;
  forehandRubberName: string | null;
  backhandRubberName: string | null;
  equipmentNotes: string | null;
}

export interface AthleteRankingSummaryDto {
  position: number | null;
  elo: number;
  wins: number;
  totalMatches: number;
  winRate: number;
  rankLevelName: string | null;
}

export interface AthleteEvolutionPointDto {
  matchId: string;
  finishedAt: ISODateString;
  opponentName: string;
  result: "win" | "loss";
  oldElo: number;
  newElo: number;
  diffPoints: number;
}

export interface AthleteProfileViewDto {
  editable: AthleteEditableProfileDto;
  ranking: AthleteRankingSummaryDto;
  evolution: AthleteEvolutionPointDto[];
}

export interface ProfileResponseDataDto {
  profile: AthleteProfileViewDto;
}
