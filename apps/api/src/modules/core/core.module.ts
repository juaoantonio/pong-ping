import { Module } from "@nestjs/common";
import { AthleteModule } from "./athlete/athlete.module";
import { ClubModule } from "./club/club.module";
import { CompetitionModule } from "./competition/competition.module";
import { CoreIdentityEventsListener } from "./application/identity";
import { RatingModule } from "./rating/rating.module";
import { TableModule } from "./table/table.module";

@Module({
  imports: [ClubModule, AthleteModule, TableModule, RatingModule, CompetitionModule],
  providers: [CoreIdentityEventsListener],
  exports: [ClubModule, AthleteModule, TableModule, RatingModule, CompetitionModule],
})
export class CoreModule {}
