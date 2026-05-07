import { DomainRuleViolation } from "../../../shared/domain";

export class ScorePoints {
  public readonly value: number;

  public constructor(value = 0) {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainRuleViolation(
        "invalid_score_points",
        "Score points must be a non-negative integer.",
      );
    }

    this.value = value;
  }

  public increment(): ScorePoints {
    return new ScorePoints(this.value + 1);
  }

  public decrement(): ScorePoints {
    if (this.value === 0) {
      throw new DomainRuleViolation(
        "score_points_cannot_be_negative",
        "Live score points cannot become negative.",
      );
    }

    return new ScorePoints(this.value - 1);
  }

  public reset(): ScorePoints {
    return new ScorePoints();
  }
}
