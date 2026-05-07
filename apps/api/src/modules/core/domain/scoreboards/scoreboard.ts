import { type ClubId } from "../clubs";
import { DomainRuleViolation } from "../shared";
import { type ActiveGame, type GameSide, type TableId } from "../tables";
import { ScoreboardSide } from "./value-objects";

type ScoreboardInput = {
  clubId: ClubId;
  tableId: TableId;
  activeGame: ActiveGame;
};

export class Scoreboard {
  public readonly clubId: ClubId;
  public readonly tableId: TableId;
  public readonly activeGame: ActiveGame;
  private readonly firstSideValue: ScoreboardSide;
  private readonly secondSideValue: ScoreboardSide;

  private constructor(input: ScoreboardInput) {
    this.clubId = input.clubId;
    this.tableId = input.tableId;
    this.activeGame = input.activeGame;
    this.firstSideValue = ScoreboardSide.create({ side: input.activeGame.firstSide });
    this.secondSideValue = ScoreboardSide.create({ side: input.activeGame.secondSide });
  }

  public static create(input: ScoreboardInput): Scoreboard {
    return new Scoreboard(input);
  }

  public get firstSide(): ScoreboardSide {
    return this.firstSideValue;
  }

  public get secondSide(): ScoreboardSide {
    return this.secondSideValue;
  }

  public pointFor(side: GameSide): void {
    this.resolveSide(side).point();
  }

  public undoPoint(side: GameSide): void {
    this.resolveSide(side).undoPoint();
  }

  public reset(): void {
    this.firstSideValue.reset();
    this.secondSideValue.reset();
  }

  private resolveSide(side: GameSide): ScoreboardSide {
    if (this.firstSideValue.matches(side)) {
      return this.firstSideValue;
    }

    if (this.secondSideValue.matches(side)) {
      return this.secondSideValue;
    }

    throw new DomainRuleViolation(
      "scoreboard_side_not_active",
      "Scoreboard side must belong to the active game.",
    );
  }
}
