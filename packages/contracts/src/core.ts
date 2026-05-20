import type { ISODateString } from "./index.js";

export const CORE_PLAY_MODE_CONTRACT = {
  SINGLES: "singles",
  DOUBLES: "doubles",
} as const;

export type CorePlayModeContract =
  (typeof CORE_PLAY_MODE_CONTRACT)[keyof typeof CORE_PLAY_MODE_CONTRACT];

export const ATHLETE_TECHNICAL_LEVEL_CONTRACT = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  COMPETITIVE: "competitive",
} as const;

export type AthleteTechnicalLevelContract =
  (typeof ATHLETE_TECHNICAL_LEVEL_CONTRACT)[keyof typeof ATHLETE_TECHNICAL_LEVEL_CONTRACT];

export const ATHLETE_GRIP_STYLE_CONTRACT = {
  CLASSIC: "classic",
  PENHOLD: "penhold",
} as const;

export type AthleteGripStyleContract =
  (typeof ATHLETE_GRIP_STYLE_CONTRACT)[keyof typeof ATHLETE_GRIP_STYLE_CONTRACT];

export const ATHLETE_PLAYING_STYLE_CONTRACT = {
  OFFENSIVE: "offensive",
  DEFENSIVE: "defensive",
  ALL_ROUND: "all_round",
} as const;

export type AthletePlayingStyleContract =
  (typeof ATHLETE_PLAYING_STYLE_CONTRACT)[keyof typeof ATHLETE_PLAYING_STYLE_CONTRACT];

export interface CreateClubRequestContract {
  name: string;
  slug: string;
}

export interface RenameClubRequestContract {
  name: string;
}

export interface ChangeClubSlugRequestContract {
  slug: string;
}

export interface ClubResponseContract {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: ISODateString;
}

export interface AthleteProfileContract {
  technicalLevel: AthleteTechnicalLevelContract | null;
  gripStyle: AthleteGripStyleContract | null;
  playingStyle: AthletePlayingStyleContract | null;
  bladeName: string | null;
  forehandRubberName: string | null;
  backhandRubberName: string | null;
  equipmentNotes: string | null;
}

export interface RegisterAthleteRequestContract {
  displayName: string;
  profile?: Partial<AthleteProfileContract>;
}

export interface UpdateAthleteProfileRequestContract {
  displayName?: string;
  profile: Partial<AthleteProfileContract>;
}

export interface AthleteResponseContract {
  id: string;
  clubId: string;
  userId: string;
  displayName: string;
  profile: AthleteProfileContract;
}

export interface CorePageRequestContract {
  page?: number;
  pageSize?: number;
}

export interface CorePageMetaContract {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface CorePageResponseContract<TItem> {
  items: TItem[];
  page: CorePageMetaContract;
}

export interface CreateTableRequestContract {
  name: string;
  playMode: CorePlayModeContract;
}

export interface RenameTableRequestContract {
  name: string;
}

export interface AthleteIdListRequestContract {
  athleteIds: string[];
}

export interface WinningAthletesRequestContract {
  winningAthleteIds: string[];
}

export interface TableMemberResponseContract {
  athleteId: string;
  joinedAt: ISODateString;
}

export interface QueueEntryResponseContract {
  athleteId: string;
  position: number;
  joinedAt: ISODateString;
}

export interface GameSideResponseContract {
  athleteIds: string[];
}

export interface ActiveGameResponseContract {
  playMode: CorePlayModeContract;
  firstSide: GameSideResponseContract;
  secondSide: GameSideResponseContract;
}

export interface TableResponseContract {
  id: string;
  clubId: string;
  name: string;
  playMode: CorePlayModeContract;
  createdByAthleteId: string;
  createdAt: ISODateString;
  members: TableMemberResponseContract[];
  queue: QueueEntryResponseContract[];
  activeGame: ActiveGameResponseContract | null;
}

export interface TableQueueEntryCommandResponseContract {
  table: TableResponseContract;
  queueEntry: QueueEntryResponseContract;
  membershipCreated?: boolean;
}

export interface TableActiveGameCommandResponseContract {
  table: TableResponseContract;
  activeGame: ActiveGameResponseContract;
}

export interface RatingDeltaResponseContract {
  athleteId: string;
  delta: {
    points: number;
    wins: number;
    totalMatches: number;
  };
}

export interface SideRatingChangeResponseContract {
  side: GameSideResponseContract;
  changes: RatingDeltaResponseContract[];
}

export interface GameRecordResponseContract {
  id: string;
  clubId: string;
  tableId: string;
  winningSide: GameSideResponseContract;
  losingSide: GameSideResponseContract;
  ratingChanges: SideRatingChangeResponseContract[];
  actorAthleteId: string;
  finishedAt: ISODateString;
  originalRecordId: string | null;
  correctionId: string | null;
  isCorrection: boolean;
}

export interface RatingReadContract {
  athleteId: string;
  athleteDisplayName: string;
  points: number;
  wins: number;
  totalMatches: number;
  winRate: number;
  tier: string | null;
}

export interface CoreTableSummaryContract {
  totalTables: number;
  activeTables: number;
  queuedAthletes: number;
  tables: TableResponseContract[];
}

export interface CoreDashboardSummaryContract {
  tables: CoreTableSummaryContract;
  activeAthleteCount: number;
  recentGames: GameRecordResponseContract[];
  ranking: RatingReadContract[];
}
