import { DomainRuleViolation } from "../../../shared/domain";
import { type Club } from "../../domain/club";
import { ClubId } from "../../domain/value-objects/club-id";
import { ClubName } from "../../domain/value-objects/club-name";
import { type ClubRepository } from "../../infrastructure/typeorm/repositories/club.repository";

export type RenameClubInput = {
  clubId: string | ClubId;
  name: string | ClubName;
};

export class RenameClubUseCase {
  public constructor(private readonly clubs: ClubRepository) {}

  public async execute(input: RenameClubInput): Promise<Club> {
    const club = await this.clubs.findById(ClubId.from(input.clubId));

    if (!club) {
      throw new DomainRuleViolation("club_not_found", "Club was not found.");
    }

    club.rename(ClubName.from(input.name));

    return this.clubs.save(club);
  }
}
