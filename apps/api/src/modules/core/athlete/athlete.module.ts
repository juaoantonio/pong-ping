import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import { CoreIdentityTranslator } from "../application/identity";
import { RegisterAthleteUseCase, UpdateAthleteProfileUseCase } from "./application/use-cases";
import { AthleteCommandController } from "./athlete-command.controller";
import { AthleteRepository } from "./infrastructure/typeorm/repositories/athlete.repository";
import { AthleteSchema } from "./infrastructure/typeorm/schemas/athlete.schema";

@Module({
  imports: [RequestContextModule, TypeOrmModule.forFeature([AthleteSchema])],
  controllers: [AthleteCommandController],
  providers: [
    AthleteRepository,
    CoreIdentityTranslator,
    {
      provide: RegisterAthleteUseCase,
      inject: [AthleteRepository],
      useFactory: (athletes: AthleteRepository) => new RegisterAthleteUseCase(athletes),
    },
    {
      provide: UpdateAthleteProfileUseCase,
      inject: [AthleteRepository],
      useFactory: (athletes: AthleteRepository) => new UpdateAthleteProfileUseCase(athletes),
    },
  ],
  exports: [
    AthleteRepository,
    CoreIdentityTranslator,
    RegisterAthleteUseCase,
    UpdateAthleteProfileUseCase,
  ],
})
export class AthleteModule {}
