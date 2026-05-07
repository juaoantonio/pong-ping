import { type AthleteId } from "../athletes";
import { DomainRuleViolation } from "../shared";
import { type GameSide } from "./game-side";
import { type PlayMode } from "./value-objects";

type ActiveGameInput = {
  playMode: PlayMode;
  firstSide: GameSide;
  secondSide: GameSide;
};

export class ActiveGame {
  public readonly playMode: PlayMode;
  private readonly firstSideValue: GameSide;
  private readonly secondSideValue: GameSide;

  private constructor(input: ActiveGameInput) {
    this.playMode = input.playMode;
    this.firstSideValue = input.firstSide;
    this.secondSideValue = input.secondSide;
  }

  public static create(input: ActiveGameInput): ActiveGame {
    ensureSideMatchesPlayMode(input.playMode, input.firstSide);
    ensureSideMatchesPlayMode(input.playMode, input.secondSide);

    const athleteIds = [...input.firstSide.athletes, ...input.secondSide.athletes].map(
      (athleteId) => athleteId.value,
    );
    const uniqueAthleteIds = new Set(athleteIds);

    if (uniqueAthleteIds.size !== athleteIds.length) {
      throw new DomainRuleViolation(
        "duplicate_active_game_athlete",
        "Active game athletes must be unique across both sides.",
      );
    }

    return new ActiveGame(input);
  }

  public get firstSide(): GameSide {
    return this.firstSideValue;
  }

  public get secondSide(): GameSide {
    return this.secondSideValue;
  }

  public get sides(): readonly [GameSide, GameSide] {
    return [this.firstSideValue, this.secondSideValue];
  }

  public containsAthlete(athleteId: AthleteId): boolean {
    return this.firstSideValue.contains(athleteId) || this.secondSideValue.contains(athleteId);
  }

  public containsSide(side: GameSide): boolean {
    return this.firstSideValue.equals(side) || this.secondSideValue.equals(side);
  }

  public otherSide(side: GameSide): GameSide {
    if (this.firstSideValue.equals(side)) {
      return this.secondSideValue;
    }

    if (this.secondSideValue.equals(side)) {
      return this.firstSideValue;
    }

    throw new DomainRuleViolation(
      "winning_side_not_active",
      "Winning side must belong to the active game.",
    );
  }
}

function ensureSideMatchesPlayMode(playMode: PlayMode, side: GameSide): void {
  if (side.size !== playMode.athletesPerSide) {
    throw new DomainRuleViolation(
      "invalid_active_game_side",
      "Active game side does not match the configured play mode.",
    );
  }
}
