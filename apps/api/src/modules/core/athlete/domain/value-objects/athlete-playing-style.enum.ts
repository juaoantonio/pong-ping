export const ATHLETE_PLAYING_STYLE = {
  OFFENSIVE: "offensive",
  DEFENSIVE: "defensive",
  ALL_ROUND: "all_round",
} as const;

export type AthletePlayingStyle =
  (typeof ATHLETE_PLAYING_STYLE)[keyof typeof ATHLETE_PLAYING_STYLE];
