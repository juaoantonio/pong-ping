import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { FindOptionsWhere, Repository } from "typeorm";
import type { ClubResponseContract } from "@pong-ping/contracts";
import { DomainRuleViolation } from "../../../../shared/domain";
import { Club, ClubId } from "../../../domain";
import { ClubSchema, type ClubPersistence } from "../../../infrastructure/typeorm/schemas/club.schema";
import { toClubResponse } from "../serializers/club-contract.serializer";

@Injectable()
export class ClubReadQuery {
  public constructor(
    @InjectRepository(ClubSchema)
    private readonly clubs: Repository<ClubPersistence>,
  ) {}

  public async getCurrentClub(tenantId: string): Promise<ClubResponseContract> {
    const club = (await this.clubs.findOneBy({
      id: ClubId.from(tenantId),
    } as FindOptionsWhere<ClubPersistence>)) as unknown as Club | null;

    if (!club) {
      throw new DomainRuleViolation("club_not_found", "Club was not found.");
    }

    return toClubResponse(club);
  }
}
