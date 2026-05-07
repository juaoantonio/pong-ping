import { type AthleteId } from "../athletes";
import { DomainRuleViolation } from "../shared";
import { type PlayMode } from "./value-objects";

export class GameSide {
  private readonly athletesValue: AthleteId[];

  private constructor(athletes: AthleteId[]) {
    this.athletesValue = athletes;
  }

  public static createSingles(athleteId: AthleteId): GameSide {
    return new GameSide([athleteId]);
  }

  public static createDoubles(firstAthleteId: AthleteId, secondAthleteId: AthleteId): GameSide {
    ensureDistinctAthletes([firstAthleteId, secondAthleteId]);

    return new GameSide([firstAthleteId, secondAthleteId]);
  }

  public static forPlayMode(playMode: PlayMode, athleteIds: readonly AthleteId[]): GameSide {
    if (athleteIds.length !== playMode.athletesPerSide) {
      throw new DomainRuleViolation(
        "invalid_game_side_size",
        "Game side does not match the configured play mode.",
      );
    }

    ensureDistinctAthletes(athleteIds);

    return new GameSide([...athleteIds]);
  }

  public get athletes(): readonly AthleteId[] {
    return [...this.athletesValue];
  }

  public get size(): number {
    return this.athletesValue.length;
  }

  public contains(athleteId: AthleteId): boolean {
    return this.athletesValue.some((currentAthleteId) => currentAthleteId.equals(athleteId));
  }

  public equals(other: GameSide): boolean {
    if (this.athletesValue.length !== other.athletesValue.length) {
      return false;
    }

    return this.athletesValue.every((athleteId, index) =>
      athleteId.equals(other.athletesValue[index]),
    );
  }
}

function ensureDistinctAthletes(athleteIds: readonly AthleteId[]): void {
  const uniqueAthleteIds = new Set(athleteIds.map((athleteId) => athleteId.value));

  if (uniqueAthleteIds.size !== athleteIds.length) {
    throw new DomainRuleViolation(
      "duplicate_game_side_athlete",
      "A game side cannot contain the same athlete twice.",
    );
  }
}
