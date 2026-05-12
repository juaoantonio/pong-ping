import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RegisterAthleteUseCase, UpdateAthleteProfileUseCase } from "./application/use-cases";
import { AthleteRepository } from "./infrastructure/typeorm/repositories/athlete.repository";
import { AthleteSchema } from "./infrastructure/typeorm/schemas/athlete.schema";

@Module({
  imports: [TypeOrmModule.forFeature([AthleteSchema])],
  providers: [
    AthleteRepository,
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
  exports: [AthleteRepository, RegisterAthleteUseCase, UpdateAthleteProfileUseCase],
})
export class AthleteModule {}
