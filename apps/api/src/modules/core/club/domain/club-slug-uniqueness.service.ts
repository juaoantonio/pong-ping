import type { ClubSlug } from "./value-objects/club-slug";
import { DomainRuleViolation } from "../../shared/domain";

export class ClubSlugUniquenessService {
  public async ensureUnique(
    slug: ClubSlug,
    exists: (slug: ClubSlug) => Promise<boolean>,
  ): Promise<void> {
    if (await exists(slug)) {
      throw new DomainRuleViolation("club_slug_already_exists", "Club slug is already in use.");
    }
  }
}
