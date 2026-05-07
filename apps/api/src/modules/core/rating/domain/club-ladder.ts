import { DomainRuleViolation } from "../../shared/domain";
import { type Rating } from "./rating";
import { Tier } from "./tier";

export type ClubLadderEntry = {
  position: number;
  rating: Rating;
  tier: Tier | null;
};

export class ClubLadder {
  public static rank(ratings: Rating[], tiers: Tier[] = []): ClubLadderEntry[] {
    if (ratings.length === 0) {
      return [];
    }

    const [firstRating] = ratings;

    for (const rating of ratings) {
      if (!rating.clubId.equals(firstRating.clubId)) {
        throw new DomainRuleViolation(
          "mixed_club_ladder",
          "Club ladder cannot include ratings from different clubs.",
        );
      }
    }

    return [...ratings]
      .sort((first, second) => {
        if (second.points.value !== first.points.value) {
          return second.points.value - first.points.value;
        }

        if (second.wins !== first.wins) {
          return second.wins - first.wins;
        }

        return first.athleteId.value.localeCompare(second.athleteId.value);
      })
      .map((rating, index) => ({
        position: index + 1,
        rating,
        tier: Tier.resolve(rating.points, tiers),
      }));
  }
}
