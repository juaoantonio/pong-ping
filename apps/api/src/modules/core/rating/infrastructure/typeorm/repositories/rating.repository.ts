import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import { AthleteId } from "../../../../athlete/domain";
import { ClubId } from "../../../../club/domain";
import { Rating } from "../../../domain/rating";
import { RatingSchema } from "../schemas/rating.schema";
import type { RatingPersistence } from "../schemas/rating.schema";

@Injectable()
export class RatingRepository {
  public constructor(
    @InjectRepository(RatingSchema)
    private readonly ratings: Repository<RatingPersistence>,
  ) {}

  public async findByAthleteId(athleteId: AthleteId): Promise<Rating | null> {
    return (await this.ratings.findOneBy({
      id: athleteId,
    } as FindOptionsWhere<RatingPersistence>)) as Rating | null;
  }

  public async getOrCreate(clubId: ClubId, athleteId: AthleteId): Promise<Rating> {
    return (await this.findByAthleteId(athleteId)) ?? Rating.createDefault({ clubId, athleteId });
  }

  public withRepository(ratings: Repository<RatingPersistence>): RatingRepository {
    return new RatingRepository(ratings);
  }

  public async save(rating: Rating): Promise<Rating> {
    return (await this.ratings.save(rating as unknown as RatingPersistence)) as unknown as Rating;
  }

  public async saveMany(ratings: readonly Rating[]): Promise<Rating[]> {
    return (await this.ratings.save(
      ratings as readonly unknown[] as RatingPersistence[],
    )) as unknown as Rating[];
  }
}
