import { DomainRuleViolation } from "../../../shared/domain";
import { type GameSide } from "../../../table/domain";
import { ScorePoints } from "./score-points";

type ScoreboardSideInput = {
  side: GameSide;
  points?: ScorePoints;
};

export class ScoreboardSide {
  private readonly sideValue: GameSide;
  private pointsValue: ScorePoints;

  private constructor(input: ScoreboardSideInput) {
    this.sideValue = input.side;
    this.pointsValue = input.points ?? new ScorePoints();
  }

  public static create(input: ScoreboardSideInput): ScoreboardSide {
    return new ScoreboardSide(input);
  }

  public get side(): GameSide {
    return this.sideValue;
  }

  public get points(): ScorePoints {
    return this.pointsValue;
  }

  public matches(side: GameSide): boolean {
    return this.sideValue.equals(side);
  }

  public point(): void {
    this.pointsValue = this.pointsValue.increment();
  }

  public undoPoint(): void {
    this.pointsValue = this.pointsValue.decrement();
  }

  public reset(): void {
    this.pointsValue = this.pointsValue.reset();
  }

  public ensureMatches(side: GameSide): void {
    if (!this.matches(side)) {
      throw new DomainRuleViolation(
        "scoreboard_side_not_active",
        "Scoreboard side must belong to the active game.",
      );
    }
  }
}
