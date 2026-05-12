import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateClubUseCase, RenameClubUseCase } from "./application/use-cases";
import { ClubRepository } from "./infrastructure/typeorm/repositories/club.repository";
import { ClubSchema } from "./infrastructure/typeorm/schemas/club.schema";

@Module({
  imports: [TypeOrmModule.forFeature([ClubSchema])],
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
  ],
  exports: [ClubRepository, CreateClubUseCase, RenameClubUseCase],
})
export class ClubModule {}
