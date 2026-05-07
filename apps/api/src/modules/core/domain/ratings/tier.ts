import { DomainRuleViolation } from "../shared";
import { RatingPoints } from "./value-objects/rating-points";
import { type TierThreshold } from "./value-objects/tier-threshold";

export class Tier {
  public readonly name: string;
  public readonly threshold: TierThreshold;

  public constructor(name: string, threshold: TierThreshold) {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new DomainRuleViolation("invalid_tier_name", "Tier name cannot be blank.");
    }

    this.name = normalizedName;
    this.threshold = threshold;
  }

  public static resolve(points: RatingPoints | number, tiers: Tier[]): Tier | null {
    const resolvedPoints =
      points instanceof RatingPoints ? points.value : new RatingPoints(points).value;

    return (
      [...tiers]
        .sort((first, second) => second.threshold.minPoints - first.threshold.minPoints)
        .find((tier) => resolvedPoints >= tier.threshold.minPoints) ?? null
    );
  }
}
