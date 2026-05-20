import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import type {
  AthleteResponseContract,
  CorePageRequestContract,
  CorePageResponseContract,
} from "@pong-ping/contracts";
import { ClubId } from "../../../../club/domain";
import { ActorId, DomainRuleViolation } from "../../../../shared/domain";
import { type Athlete } from "../../../domain";
import {
  AthleteSchema,
  type AthletePersistence,
} from "../../../infrastructure/typeorm/schemas/athlete.schema";
import {
  createCorePage,
  corePageSkip,
} from "../../../../shared/presentation/http/dtos/core-page.dtos";
import { toAthleteResponse } from "../serializers/athlete-contract.serializer";

@Injectable()
export class AthleteReadQuery {
  public constructor(
    @InjectRepository(AthleteSchema)
    private readonly athletes: Repository<AthletePersistence>,
  ) {}

  public async getCurrentAthlete(
    tenantId: string,
    userId: string,
  ): Promise<AthleteResponseContract> {
    const athlete = (await this.athletes.findOneBy({
      clubId: ClubId.from(tenantId),
      userId: ActorId.from(userId),
    } as FindOptionsWhere<AthletePersistence>)) as unknown as Athlete | null;

    if (!athlete) {
      throw new DomainRuleViolation("athlete_not_found", "Current athlete was not found.");
    }

    return toAthleteResponse(athlete);
  }

  public async listAthletes(
    tenantId: string,
    request: CorePageRequestContract,
  ): Promise<CorePageResponseContract<AthleteResponseContract>> {
    const pageSize = request.pageSize ?? 20;
    const [athletes, totalItems] = await this.athletes.findAndCount({
      order: { displayNameValue: "ASC" },
      skip: corePageSkip(request),
      take: pageSize,
      where: {
        clubId: ClubId.from(tenantId),
      } as FindOptionsWhere<AthletePersistence>,
    });

    return createCorePage(
      (athletes as unknown as Athlete[]).map(toAthleteResponse),
      totalItems,
      request,
    );
  }

  public async countAthletes(tenantId: string): Promise<number> {
    return this.athletes.count({
      where: {
        clubId: ClubId.from(tenantId),
      } as FindOptionsWhere<AthletePersistence>,
    });
  }
}
