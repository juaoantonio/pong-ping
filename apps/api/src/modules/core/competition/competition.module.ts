import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RatingModule } from "../rating/rating.module";
import { TableModule } from "../table/table.module";
import { CorrectGameUseCase, RecordGameUseCase } from "./application/use-cases";
import { GameRecordRepository } from "./infrastructure/typeorm/repositories/game-record.repository";
import { GameRecordSchema } from "./infrastructure/typeorm/schemas/game-record.schema";
import { RatingRepository } from "../rating/infrastructure/typeorm/repositories/rating.repository";
import { EloRatingService } from "../rating/domain";
import { TableRepository } from "../table/infrastructure/typeorm/repositories/table.repository";

@Module({
  imports: [TypeOrmModule.forFeature([GameRecordSchema]), TableModule, RatingModule],
  providers: [
    GameRecordRepository,
    {
      provide: RecordGameUseCase,
      inject: [TableRepository, GameRecordRepository, RatingRepository, EloRatingService],
      useFactory: (
        tables: TableRepository,
        records: GameRecordRepository,
        ratings: RatingRepository,
        elo: EloRatingService,
      ) => new RecordGameUseCase(tables, records, ratings, elo),
    },
    {
      provide: CorrectGameUseCase,
      inject: [GameRecordRepository, RatingRepository],
      useFactory: (records: GameRecordRepository, ratings: RatingRepository) =>
        new CorrectGameUseCase(records, ratings),
    },
  ],
  exports: [GameRecordRepository, RecordGameUseCase, CorrectGameUseCase],
})
export class CompetitionModule {}
