import { DomainRuleViolation } from "../../shared";

type RatingDeltaInput = {
  points: number;
  wins: number;
  totalMatches: number;
};

export class RatingDelta {
  public readonly points: number;
  public readonly wins: number;
  public readonly totalMatches: number;

  public constructor(input: RatingDeltaInput) {
    if (
      !Number.isInteger(input.points) ||
      !Number.isInteger(input.wins) ||
      !Number.isInteger(input.totalMatches)
    ) {
      throw new DomainRuleViolation(
        "invalid_rating_delta",
        "Rating delta values must be integers.",
      );
    }

    if (
      (input.totalMatches === 0 && input.wins !== 0) ||
      Math.abs(input.wins) > Math.abs(input.totalMatches)
    ) {
      throw new DomainRuleViolation(
        "invalid_rating_delta",
        "Rating delta wins must stay within total match changes.",
      );
    }

    this.points = input.points;
    this.wins = input.wins;
    this.totalMatches = input.totalMatches;
  }

  public invert(): RatingDelta {
    return new RatingDelta({
      points: this.points * -1,
      wins: this.wins * -1,
      totalMatches: this.totalMatches * -1,
    });
  }
}
