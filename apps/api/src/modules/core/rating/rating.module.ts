import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EloRatingService } from "./domain";
import { RatingRepository } from "./infrastructure/typeorm/repositories/rating.repository";
import { RatingSchema } from "./infrastructure/typeorm/schemas/rating.schema";

@Module({
  imports: [TypeOrmModule.forFeature([RatingSchema])],
  providers: [RatingRepository, EloRatingService],
  exports: [RatingRepository, EloRatingService, TypeOrmModule],
})
export class RatingModule {}
