import { type AthleteId } from "../athletes";
import { DomainRuleViolation } from "../shared";
import { GameRecord, type GameRecordState } from "./game-record";
import { GameResult } from "./game-result";
import { GameRecordId } from "./value-objects/game-record-id";

export class GameCorrection extends GameRecord {
  private constructor(input: GameRecordState) {
    super(input);
  }

  public static createCompensating(
    originalRecord: GameRecord,
    actorAthleteId: AthleteId,
    correctedAt: Date = new Date(),
  ): GameCorrection {
    if (originalRecord.isCorrection) {
      throw new DomainRuleViolation(
        "game_correction_target_is_correction",
        "Game correction cannot target another correction record.",
      );
    }

    return new GameCorrection({
      clubId: originalRecord.clubId,
      tableId: originalRecord.tableId,
      result: new GameResult(originalRecord.losingSide, originalRecord.winningSide),
      winnerRatingChange: originalRecord.loserRatingChange.reverse(),
      loserRatingChange: originalRecord.winnerRatingChange.reverse(),
      actorAthleteId,
      finishedAt: correctedAt,
      originalRecordId: originalRecord.id,
      id: new GameRecordId(`${originalRecord.id.value}:correction`),
    });
  }
}
