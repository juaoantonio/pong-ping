import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import { AthleteSchema } from "../athlete/infrastructure/typeorm/schemas/athlete.schema";
import { EloRatingService } from "./domain";
import { RatingRepository } from "./infrastructure/typeorm/repositories/rating.repository";
import { RatingSchema } from "./infrastructure/typeorm/schemas/rating.schema";
import { RatingReadQuery } from "./presentation/http/queries/rating-read.query";
import { RatingReadController } from "./rating-read.controller";

@Module({
  imports: [RequestContextModule, TypeOrmModule.forFeature([RatingSchema, AthleteSchema])],
  controllers: [RatingReadController],
  providers: [RatingRepository, RatingReadQuery, EloRatingService],
  exports: [RatingRepository, RatingReadQuery, EloRatingService, TypeOrmModule],
})
export class RatingModule {}
