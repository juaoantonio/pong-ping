export const ATHLETE_TECHNICAL_LEVEL = {
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced",
  COMPETITIVE: "competitive",
} as const;

export type AthleteTechnicalLevel =
  (typeof ATHLETE_TECHNICAL_LEVEL)[keyof typeof ATHLETE_TECHNICAL_LEVEL];
