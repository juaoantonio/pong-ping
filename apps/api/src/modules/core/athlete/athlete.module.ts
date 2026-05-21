import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import { CoreIdentityTranslator } from "../application/identity";
import { RatingModule } from "../rating/rating.module";
import { RatingRepository } from "../rating/infrastructure/typeorm/repositories/rating.repository";
import { RegisterAthleteUseCase, UpdateAthleteProfileUseCase } from "./application/use-cases";
import { AthleteCommandController } from "./athlete-command.controller";
import { AthleteReadController } from "./athlete-read.controller";
import { AthleteRepository } from "./infrastructure/typeorm/repositories/athlete.repository";
import { AthleteSchema } from "./infrastructure/typeorm/schemas/athlete.schema";
import { AthleteReadQuery } from "./presentation/http/queries/athlete-read.query";

@Module({
  imports: [RequestContextModule, TypeOrmModule.forFeature([AthleteSchema]), RatingModule],
  controllers: [AthleteCommandController, AthleteReadController],
  providers: [
    AthleteRepository,
    AthleteReadQuery,
    CoreIdentityTranslator,
    {
      provide: RegisterAthleteUseCase,
      inject: [AthleteRepository, RatingRepository],
      useFactory: (athletes: AthleteRepository, ratings: RatingRepository) =>
        new RegisterAthleteUseCase(athletes, ratings),
    },
    {
      provide: UpdateAthleteProfileUseCase,
      inject: [AthleteRepository],
      useFactory: (athletes: AthleteRepository) => new UpdateAthleteProfileUseCase(athletes),
    },
  ],
  exports: [
    AthleteRepository,
    AthleteReadQuery,
    CoreIdentityTranslator,
    RegisterAthleteUseCase,
    UpdateAthleteProfileUseCase,
  ],
})
export class AthleteModule {}
