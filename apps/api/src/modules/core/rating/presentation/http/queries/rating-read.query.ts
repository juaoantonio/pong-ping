import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type FindOptionsWhere, type Repository } from "typeorm";
import type {
  CorePageRequestContract,
  CorePageResponseContract,
  RatingReadContract,
} from "@pong-ping/contracts";
import { AthleteId } from "../../../../athlete/domain";
import {
  AthleteSchema,
  type AthletePersistence,
} from "../../../../athlete/infrastructure/typeorm/schemas/athlete.schema";
import { ClubId } from "../../../../club/domain";
import { type Rating } from "../../../domain/rating";
import {
  RatingSchema,
  type RatingPersistence,
} from "../../../infrastructure/typeorm/schemas/rating.schema";
import {
  createCorePage,
  corePageSkip,
} from "../../../../shared/presentation/http/dtos/core-page.dtos";

@Injectable()
export class RatingReadQuery {
  public constructor(
    @InjectRepository(RatingSchema)
    private readonly ratings: Repository<RatingPersistence>,
    @InjectRepository(AthleteSchema)
    private readonly athletes: Repository<AthletePersistence>,
  ) {}

  public async listRatings(
    tenantId: string,
    request: CorePageRequestContract,
  ): Promise<CorePageResponseContract<RatingReadContract>> {
    const pageSize = request.pageSize ?? 20;
    const [ratings, totalItems] = await this.ratings.findAndCount({
      order: { pointsValue: "DESC" } as never,
      skip: corePageSkip(request),
      take: pageSize,
      where: {
        clubId: ClubId.from(tenantId),
      } as FindOptionsWhere<RatingPersistence>,
    });
    const items = await this.toRatingReadContracts(ratings as unknown as Rating[]);

    return createCorePage(items, totalItems, request);
  }

  private async toRatingReadContracts(ratings: Rating[]): Promise<RatingReadContract[]> {
    if (ratings.length === 0) return [];

    const athleteIds = ratings.map((rating) => rating.athleteId.value);
    const athletes = (await this.athletes.findBy({
      id: In(athleteIds.map((athleteId) => AthleteId.from(athleteId))),
    } as FindOptionsWhere<AthletePersistence>)) as unknown as Array<{
      id: AthleteId;
      displayName: { value: string };
    }>;
    const athleteNames = new Map(
      athletes.map((athlete) => [athlete.id.value, athlete.displayName.value]),
    );

    return ratings.map((rating) => ({
      athleteId: rating.athleteId.value,
      athleteDisplayName: athleteNames.get(rating.athleteId.value) ?? rating.athleteId.value,
      points: rating.points.value,
      wins: rating.wins,
      totalMatches: rating.totalMatches,
      winRate: rating.winRate.value,
      tier: null,
    }));
  }
}
