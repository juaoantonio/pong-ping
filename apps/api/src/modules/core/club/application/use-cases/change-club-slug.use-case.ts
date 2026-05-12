import { DomainRuleViolation } from "../../../shared/domain";
import { type Club } from "../../domain/club";
import { ClubSlugUniquenessService } from "../../domain/club-slug-uniqueness.service";
import { ClubId } from "../../domain/value-objects/club-id";
import { ClubSlug } from "../../domain/value-objects/club-slug";
import { type ClubRepository } from "../../infrastructure/typeorm/repositories/club.repository";

export type ChangeClubSlugInput = {
  clubId: string | ClubId;
  slug: string | ClubSlug;
};

export class ChangeClubSlugUseCase {
  private readonly slugUniqueness = new ClubSlugUniquenessService();

  public constructor(private readonly clubs: ClubRepository) {}

  public async execute(input: ChangeClubSlugInput): Promise<Club> {
    const club = await this.clubs.findById(ClubId.from(input.clubId));

    if (!club) {
      throw new DomainRuleViolation("club_not_found", "Club was not found.");
    }

    const slug = ClubSlug.from(input.slug);
    if (club.slug.value !== slug.value) {
      await this.slugUniqueness.ensureUnique(slug, (candidate) =>
        this.clubs.existsBySlug(candidate),
      );
    }

    club.changeSlug(slug);

    return this.clubs.save(club);
  }
}
