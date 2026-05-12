import { AthleteId } from "../../athlete/domain";
import { DomainRuleViolation } from "../../shared/domain";
import { RatingDelta, type RatingDeltaInput } from "../../rating/domain";
import { type GameSide } from "../../table/domain";

export type AthleteRatingDelta = {
  athleteId: AthleteId;
  delta: RatingDelta;
};

export type AthleteRatingDeltaData = {
  athleteId: string | AthleteId;
  delta: RatingDelta | RatingDeltaInput;
};

export type SideRatingChangeInput = {
  side: GameSide;
  changes: readonly (AthleteRatingDelta | AthleteRatingDeltaData)[];
};

export class SideRatingChange {
  public readonly side: GameSide;
  public readonly changes: readonly AthleteRatingDelta[];

  public constructor(side: GameSide, changes: readonly AthleteRatingDelta[]) {
    if (changes.length !== side.athletes.length) {
      throw new DomainRuleViolation(
        "side_rating_change_mismatch",
        "Side rating changes must match the athletes on the game side.",
      );
    }

    const changesByAthlete = new Map<string, AthleteRatingDelta>();

    for (const change of changes) {
      if (changesByAthlete.has(change.athleteId.value)) {
        throw new DomainRuleViolation(
          "duplicate_side_rating_change",
          "Each athlete on a game side can only have one rating delta.",
        );
      }

      changesByAthlete.set(change.athleteId.value, change);
    }

    this.side = side;
    this.changes = side.athletes.map((athleteId) => {
      const change = changesByAthlete.get(athleteId.value);

      if (!change) {
        throw new DomainRuleViolation(
          "side_rating_change_mismatch",
          "Side rating changes must include every athlete on the game side.",
        );
      }

      return change;
    });
  }

  public static from(input: SideRatingChange | SideRatingChangeInput): SideRatingChange {
    return input instanceof SideRatingChange
      ? input
      : new SideRatingChange(
          input.side,
          input.changes.map((change) => ({
            athleteId: AthleteId.from(change.athleteId),
            delta: RatingDelta.from(change.delta),
          })),
        );
  }

  public appliesTo(side: GameSide): boolean {
    return this.side.equals(side);
  }

  public reverse(): SideRatingChange {
    return new SideRatingChange(
      this.side,
      this.changes.map((change) => ({
        athleteId: change.athleteId,
        delta: change.delta.invert(),
      })),
    );
  }
}
