import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import { CoreIdentityTranslator } from "../application/identity";
import { AthleteModule } from "../athlete/athlete.module";
import { RatingModule } from "../rating/rating.module";
import { TableModule } from "../table/table.module";
import { CorrectGameUseCase, RecordGameUseCase } from "./application/use-cases";
import { CompetitionCommandController } from "./competition-command.controller";
import { CompetitionReadController } from "./competition-read.controller";
import { GameRecordRepository } from "./infrastructure/typeorm/repositories/game-record.repository";
import { GameRecordSchema } from "./infrastructure/typeorm/schemas/game-record.schema";
import { RatingRepository } from "../rating/infrastructure/typeorm/repositories/rating.repository";
import { EloRatingService } from "../rating/domain";
import { TableRepository } from "../table/infrastructure/typeorm/repositories/table.repository";
import { GameReadQuery } from "./presentation/http/queries/game-read.query";

@Module({
  imports: [
    RequestContextModule,
    TypeOrmModule.forFeature([GameRecordSchema]),
    TableModule,
    RatingModule,
    AthleteModule,
  ],
  controllers: [CompetitionCommandController, CompetitionReadController],
  providers: [
    GameRecordRepository,
    GameReadQuery,
    CoreIdentityTranslator,
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
  exports: [GameRecordRepository, GameReadQuery, RecordGameUseCase, CorrectGameUseCase],
})
export class CompetitionModule {}
