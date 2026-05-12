import { AthleteId } from "../../../athlete/domain";
import { type RatingRepository } from "../../../rating/infrastructure/typeorm/repositories/rating.repository";
import { type EloRatingService, type Rating } from "../../../rating/domain";
import { type TableRepository } from "../../../table/infrastructure/typeorm/repositories/table.repository";
import { TableId } from "../../../table/domain/value-objects/table-id";
import { DomainRuleViolation } from "../../../shared/domain";
import { SideRatingChange } from "../../domain/side-rating-change";
import { GameRecord } from "../../domain/game-record";
import { type GameRecordRepository } from "../../infrastructure/typeorm/repositories/game-record.repository";
import { toWinningSide } from "./competition-use-case-helpers";

export type RecordGameInput = {
  tableId: string | TableId;
  winningAthleteIds: readonly (string | AthleteId)[];
  actorAthleteId: string | AthleteId;
  finishedAt?: Date;
};

export class RecordGameUseCase {
  public constructor(
    private readonly tables: TableRepository,
    private readonly gameRecords: GameRecordRepository,
    private readonly ratings: RatingRepository,
    private readonly eloRatingService: EloRatingService,
  ) {}

  public async execute(input: RecordGameInput): Promise<GameRecord> {
    const transaction = (this.gameRecords as Partial<Pick<GameRecordRepository, "transaction">>)
      .transaction;

    if (transaction) {
      const record = await transaction.call(
        this.gameRecords,
        this.ratings,
        ({ gameRecords, ratings }) => this.executeWithRepositories(input, gameRecords, ratings),
      );

      return record as GameRecord;
    }

    return this.executeWithRepositories(input, this.gameRecords, this.ratings);
  }

  private async executeWithRepositories(
    input: RecordGameInput,
    gameRecords: GameRecordRepository,
    ratings: RatingRepository,
  ): Promise<GameRecord> {
    const table = await this.tables.findById(TableId.from(input.tableId));

    if (!table) {
      throw new DomainRuleViolation("table_not_found", "Table was not found.");
    }

    const activeGame = table.formActiveGame();
    const winningSide = toWinningSide(activeGame, input.winningAthleteIds);
    const losingSide = activeGame.otherSide(winningSide);
    const winnerRatings = await this.loadRatings(ratings, table.clubId, winningSide.athletes);
    const loserRatings = await this.loadRatings(ratings, table.clubId, losingSide.athletes);

    const winnerDeltas = winnerRatings.map((winnerRating, index) => {
      const loserRating = loserRatings[index];

      if (!loserRating) {
        throw new DomainRuleViolation(
          "rating_side_size_mismatch",
          "Winner and loser sides must have matching rating pairs.",
        );
      }

      return winnerRating.recordWinAgainst(loserRating, this.eloRatingService);
    });

    const winnerRatingChange = new SideRatingChange(
      winningSide,
      winnerRatings.map((rating, index) => ({
        athleteId: rating.athleteId,
        delta: winnerDeltas[index].winnerDelta,
      })),
    );
    const loserRatingChange = new SideRatingChange(
      losingSide,
      loserRatings.map((rating, index) => ({
        athleteId: rating.athleteId,
        delta: winnerDeltas[index].loserDelta,
      })),
    );

    const record = GameRecord.record({
      clubId: table.clubId,
      tableId: table.id,
      activeGame,
      winningSide,
      ratingChanges: [winnerRatingChange, loserRatingChange],
      actorAthleteId: AthleteId.from(input.actorAthleteId),
      finishedAt: input.finishedAt ?? new Date(),
    });

    await ratings.saveMany([...winnerRatings, ...loserRatings]);

    return gameRecords.save(record);
  }

  private async loadRatings(
    ratings: RatingRepository,
    clubId: Rating["clubId"],
    athleteIds: readonly AthleteId[],
  ): Promise<Rating[]> {
    return Promise.all(athleteIds.map((athleteId) => ratings.getOrCreate(clubId, athleteId)));
  }
}
