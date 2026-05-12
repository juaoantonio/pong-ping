import { DomainRuleViolation } from "../../../shared/domain";
import { type Club } from "../../domain/club";
import { ClubId } from "../../domain/value-objects/club-id";
import { type ClubRepository } from "../../infrastructure/typeorm/repositories/club.repository";

export type DeactivateClubInput = {
  clubId: string | ClubId;
};

export class DeactivateClubUseCase {
  public constructor(private readonly clubs: ClubRepository) {}

  public async execute(input: DeactivateClubInput): Promise<Club> {
    const club = await this.clubs.findById(ClubId.from(input.clubId));

    if (!club) {
      throw new DomainRuleViolation("club_not_found", "Club was not found.");
    }

    club.deactivate();

    return this.clubs.save(club);
  }
}
