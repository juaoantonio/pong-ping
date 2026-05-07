import { randomUUID } from "node:crypto";
import { type AthleteId } from "../../athlete/domain";
import { type ClubId } from "../../club/domain";
import { AggregateRoot, DomainRuleViolation } from "../../shared/domain";
import { type ActiveGame, type GameSide } from "../../table/domain";
import { GameCorrection } from "./game-correction";
import { GameResult } from "./game-result";
import { type SideRatingChange } from "./side-rating-change";
import { GameRecordId } from "./value-objects/game-record-id";
import { type TableId } from "../../table/domain";

export type GameRecordState = {
  id?: GameRecordId;
  clubId: ClubId;
  tableId: TableId;
  result: GameResult;
  winnerRatingChange: SideRatingChange;
  loserRatingChange: SideRatingChange;
  actorAthleteId: AthleteId;
  finishedAt: Date;
  originalRecordId?: GameRecordId;
};

type RecordGameInput = {
  id?: GameRecordId;
  clubId: ClubId;
  tableId: TableId;
  activeGame: ActiveGame;
  winningSide: GameSide;
  ratingChanges: readonly [SideRatingChange, SideRatingChange];
  actorAthleteId: AthleteId;
  finishedAt: Date;
};

type CorrectGameInput = {
  actorAthleteId: AthleteId;
  correctedAt?: Date;
};

export class GameRecord extends AggregateRoot<GameRecordId> {
  private readonly clubIdValue: ClubId;
  private readonly tableIdValue: TableId;
  private readonly resultValue: GameResult;
  private readonly winnerRatingChangeValue: SideRatingChange;
  private readonly loserRatingChangeValue: SideRatingChange;
  private readonly actorAthleteIdValue: AthleteId;
  public readonly finishedAt: Date;
  private readonly originalRecordIdValue: GameRecordId | null;
  private correctionIdValue: GameRecordId | null;

  protected constructor(input: GameRecordState) {
    super(input.id ?? new GameRecordId(randomUUID()));
    this.clubIdValue = input.clubId;
    this.tableIdValue = input.tableId;
    this.resultValue = input.result;
    this.winnerRatingChangeValue = input.winnerRatingChange;
    this.loserRatingChangeValue = input.loserRatingChange;
    this.actorAthleteIdValue = input.actorAthleteId;
    this.finishedAt = cloneDate(input.finishedAt, "invalid_game_finished_at");
    this.originalRecordIdValue = input.originalRecordId ?? null;
    this.correctionIdValue = null;
  }

  public static record(input: RecordGameInput): GameRecord {
    const result = GameResult.fromActiveGame(input.activeGame, input.winningSide);
    const [winnerRatingChange, loserRatingChange] = normalizeRatingChanges(
      result,
      input.ratingChanges,
    );

    return new GameRecord({
      id: input.id,
      clubId: input.clubId,
      tableId: input.tableId,
      result,
      winnerRatingChange,
      loserRatingChange,
      actorAthleteId: input.actorAthleteId,
      finishedAt: input.finishedAt,
    });
  }

  public get clubId(): ClubId {
    return this.clubIdValue;
  }

  public get tableId(): TableId {
    return this.tableIdValue;
  }

  public get winningSide(): GameSide {
    return this.resultValue.winner;
  }

  public get losingSide(): GameSide {
    return this.resultValue.loser;
  }

  public get winnerRatingChange(): SideRatingChange {
    return this.winnerRatingChangeValue;
  }

  public get loserRatingChange(): SideRatingChange {
    return this.loserRatingChangeValue;
  }

  public get ratingChanges(): readonly [SideRatingChange, SideRatingChange] {
    return [this.winnerRatingChangeValue, this.loserRatingChangeValue];
  }

  public get actorAthleteId(): AthleteId {
    return this.actorAthleteIdValue;
  }

  public get correctionId(): GameRecordId | null {
    return this.correctionIdValue;
  }

  public get originalRecordId(): GameRecordId | null {
    return this.originalRecordIdValue;
  }

  public get isCorrection(): boolean {
    return this.originalRecordIdValue !== null;
  }

  public correct(input: CorrectGameInput): GameCorrection {
    if (this.isCorrection) {
      throw new DomainRuleViolation(
        "game_correction_target_is_correction",
        "Game correction cannot target another correction record.",
      );
    }

    if (this.correctionIdValue) {
      throw new DomainRuleViolation(
        "game_record_already_corrected",
        "Game record already has a compensating correction.",
      );
    }

    const correction = GameCorrection.createCompensating(
      this,
      input.actorAthleteId,
      input.correctedAt,
    );

    this.correctionIdValue = correction.id;

    return correction;
  }
}

function normalizeRatingChanges(
  result: GameResult,
  ratingChanges: readonly [SideRatingChange, SideRatingChange],
): [SideRatingChange, SideRatingChange] {
  const winnerRatingChange = ratingChanges.find((change) => change.appliesTo(result.winner));
  const loserRatingChange = ratingChanges.find((change) => change.appliesTo(result.loser));

  if (!winnerRatingChange || !loserRatingChange) {
    throw new DomainRuleViolation(
      "side_rating_change_mismatch",
      "Game record must store rating changes for both winner and loser sides.",
    );
  }

  return [winnerRatingChange, loserRatingChange];
}

function cloneDate(value: Date, code: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new DomainRuleViolation(code, "Date value must be valid.");
  }

  return new Date(value);
}
