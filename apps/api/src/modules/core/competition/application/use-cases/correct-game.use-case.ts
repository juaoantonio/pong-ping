import { AthleteId } from "../../../athlete/domain";
import { type RatingRepository } from "../../../rating/infrastructure/typeorm/repositories/rating.repository";
import { DomainRuleViolation } from "../../../shared/domain";
import { type GameRecord } from "../../domain/game-record";
import { GameRecordId } from "../../domain/value-objects/game-record-id";
import { type GameRecordRepository } from "../../infrastructure/typeorm/repositories/game-record.repository";

export type CorrectGameInput = {
  gameRecordId: string | GameRecordId;
  actorAthleteId: string | AthleteId;
  correctedAt?: Date;
};

export class CorrectGameUseCase {
  public constructor(
    private readonly gameRecords: GameRecordRepository,
    private readonly ratings: RatingRepository,
  ) {}

  public async execute(input: CorrectGameInput): Promise<GameRecord> {
    const transaction = (this.gameRecords as Partial<Pick<GameRecordRepository, "transaction">>)
      .transaction;

    if (transaction) {
      const correction = await transaction.call(
        this.gameRecords,
        this.ratings,
        ({ gameRecords, ratings }) => this.executeWithRepositories(input, gameRecords, ratings),
      );

      return correction as GameRecord;
    }

    return this.executeWithRepositories(input, this.gameRecords, this.ratings);
  }

  private async executeWithRepositories(
    input: CorrectGameInput,
    gameRecords: GameRecordRepository,
    ratings: RatingRepository,
  ): Promise<GameRecord> {
    const record = await gameRecords.findById(GameRecordId.from(input.gameRecordId));

    if (!record) {
      throw new DomainRuleViolation("game_record_not_found", "Game record was not found.");
    }

    const correction = record.correct({
      actorAthleteId: AthleteId.from(input.actorAthleteId),
      correctedAt: input.correctedAt ?? new Date(),
    });

    const affectedRatings = await Promise.all(
      correction.ratingChanges.flatMap((change) =>
        change.changes.map(async (athleteChange) => {
          const rating = await ratings.findByAthleteId(athleteChange.athleteId);

          if (!rating) {
            throw new DomainRuleViolation(
              "rating_not_found",
              "Rating was not found for game correction.",
            );
          }

          rating.applyCorrection(athleteChange.delta);

          return rating;
        }),
      ),
    );

    await ratings.saveMany(affectedRatings);
    await gameRecords.saveMany([record, correction]);

    return correction;
  }
}
