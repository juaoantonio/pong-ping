import { Module } from "@nestjs/common";
import { AthleteModule } from "./athlete/athlete.module";
import { ClubModule } from "./club/club.module";
import { CompetitionModule } from "./competition/competition.module";
import { RatingModule } from "./rating/rating.module";
import { TableModule } from "./table/table.module";

@Module({
  imports: [ClubModule, AthleteModule, TableModule, RatingModule, CompetitionModule],
  exports: [ClubModule, AthleteModule, TableModule, RatingModule, CompetitionModule],
})
export class CoreModule {}
