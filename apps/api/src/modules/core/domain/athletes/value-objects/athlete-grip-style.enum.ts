export const ATHLETE_GRIP_STYLE = {
  CLASSIC: "classic",
  PENHOLD: "penhold",
} as const;

export type AthleteGripStyle = (typeof ATHLETE_GRIP_STYLE)[keyof typeof ATHLETE_GRIP_STYLE];
