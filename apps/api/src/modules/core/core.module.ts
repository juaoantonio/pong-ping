import { Module } from "@nestjs/common";
import { RequestContextModule } from "../../common/context";
import { AthleteModule } from "./athlete/athlete.module";
import { ClubModule } from "./club/club.module";
import { CompetitionModule } from "./competition/competition.module";
import { CoreIdentityEventsListener } from "./application/identity";
import { CoreDashboardReadController } from "./core-dashboard-read.controller";
import { CoreDashboardReadQuery } from "./presentation/http/queries/core-dashboard-read.query";
import { RatingModule } from "./rating/rating.module";
import { TableModule } from "./table/table.module";

@Module({
  imports: [
    RequestContextModule,
    ClubModule,
    AthleteModule,
    TableModule,
    RatingModule,
    CompetitionModule,
  ],
  controllers: [CoreDashboardReadController],
  providers: [CoreIdentityEventsListener, CoreDashboardReadQuery],
  exports: [ClubModule, AthleteModule, TableModule, RatingModule, CompetitionModule],
})
export class CoreModule {}
