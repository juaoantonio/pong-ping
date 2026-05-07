import { DomainRuleViolation } from "../../shared";

export const DEFAULT_RATING_POINTS = 1000;

export class RatingPoints {
  public readonly value: number;

  public constructor(value: number) {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainRuleViolation(
        "invalid_rating_points",
        "Rating points must be a non-negative integer.",
      );
    }

    this.value = value;
  }

  public static default(): RatingPoints {
    return new RatingPoints(DEFAULT_RATING_POINTS);
  }
}
