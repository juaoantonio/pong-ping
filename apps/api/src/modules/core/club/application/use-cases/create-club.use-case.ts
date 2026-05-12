import { Club } from "../../domain/club";
import { ClubSlugUniquenessService } from "../../domain/club-slug-uniqueness.service";
import { ClubId } from "../../domain/value-objects/club-id";
import { ClubName } from "../../domain/value-objects/club-name";
import { ClubSlug } from "../../domain/value-objects/club-slug";
import { type ClubRepository } from "../../infrastructure/typeorm/repositories/club.repository";

export type CreateClubInput = {
  id: string | ClubId;
  name: string | ClubName;
  slug: string | ClubSlug;
  createdAt?: Date;
};

export class CreateClubUseCase {
  private readonly slugUniqueness = new ClubSlugUniquenessService();

  public constructor(private readonly clubs: ClubRepository) {}

  public async execute(input: CreateClubInput): Promise<Club> {
    const slug = ClubSlug.from(input.slug);

    await this.slugUniqueness.ensureUnique(slug, (candidate) => this.clubs.existsBySlug(candidate));

    const club = Club.create({
      id: ClubId.from(input.id),
      name: ClubName.from(input.name),
      slug,
      createdAt: input.createdAt ?? new Date(),
    });

    return this.clubs.save(club);
  }
}
