import { DomainRuleViolation } from "../../../shared/domain";

export class TierThreshold {
  public readonly minPoints: number;

  public static from(value: number | TierThreshold): TierThreshold {
    return value instanceof TierThreshold ? value : new TierThreshold(value);
  }

  public constructor(minPoints: number) {
    if (!Number.isInteger(minPoints) || minPoints < 0) {
      throw new DomainRuleViolation(
        "invalid_tier_threshold",
        "Tier threshold must be a non-negative integer.",
      );
    }

    this.minPoints = minPoints;
  }
}
