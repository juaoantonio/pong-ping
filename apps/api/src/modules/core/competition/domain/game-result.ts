import { DomainRuleViolation } from "../../shared/domain";
import { type ActiveGame, type GameSide } from "../../table/domain";

export class GameResult {
  private readonly winnerValue: GameSide;
  private readonly loserValue: GameSide;

  public constructor(winner: GameSide, loser: GameSide) {
    if (winner.equals(loser)) {
      throw new DomainRuleViolation(
        "invalid_game_result",
        "Game result must contain different winner and loser sides.",
      );
    }

    this.winnerValue = winner;
    this.loserValue = loser;
  }

  public static fromActiveGame(activeGame: ActiveGame, winningSide: GameSide): GameResult {
    if (!activeGame.containsSide(winningSide)) {
      throw new DomainRuleViolation(
        "winning_side_not_active",
        "Winning side must be one of the sides in the active game.",
      );
    }

    const losingSide = activeGame.otherSide(winningSide);

    return new GameResult(winningSide, losingSide);
  }

  public get winner(): GameSide {
    return this.winnerValue;
  }

  public get loser(): GameSide {
    return this.loserValue;
  }
}
