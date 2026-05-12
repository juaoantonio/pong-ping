import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../../common/context";
import {
  ActivateClubUseCase,
  ChangeClubSlugUseCase,
  CreateClubUseCase,
  DeactivateClubUseCase,
  RenameClubUseCase,
} from "./application/use-cases";
import { ClubCommandController } from "./club-command.controller";
import { ClubRepository } from "./infrastructure/typeorm/repositories/club.repository";
import { ClubSchema } from "./infrastructure/typeorm/schemas/club.schema";

@Module({
  imports: [RequestContextModule, TypeOrmModule.forFeature([ClubSchema])],
  controllers: [ClubCommandController],
  providers: [
    ClubRepository,
    {
      provide: CreateClubUseCase,
      inject: [ClubRepository],
      useFactory: (clubs: ClubRepository) => new CreateClubUseCase(clubs),
    },
    {
      provide: RenameClubUseCase,
      inject: [ClubRepository],
      useFactory: (clubs: ClubRepository) => new RenameClubUseCase(clubs),
    },
    {
      provide: ChangeClubSlugUseCase,
      inject: [ClubRepository],
      useFactory: (clubs: ClubRepository) => new ChangeClubSlugUseCase(clubs),
    },
    {
      provide: ActivateClubUseCase,
      inject: [ClubRepository],
      useFactory: (clubs: ClubRepository) => new ActivateClubUseCase(clubs),
    },
    {
      provide: DeactivateClubUseCase,
      inject: [ClubRepository],
      useFactory: (clubs: ClubRepository) => new DeactivateClubUseCase(clubs),
    },
  ],
  exports: [
    ClubRepository,
    CreateClubUseCase,
    RenameClubUseCase,
    ChangeClubSlugUseCase,
    ActivateClubUseCase,
    DeactivateClubUseCase,
  ],
})
export class ClubModule {}
