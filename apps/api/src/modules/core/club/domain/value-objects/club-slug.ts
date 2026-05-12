import { DomainRuleViolation } from "../../../shared/domain";

const CLUB_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ClubSlug {
  public readonly value: string;

  public static from(value: string | ClubSlug): ClubSlug {
    return value instanceof ClubSlug ? value : new ClubSlug(value);
  }

  public constructor(value: string) {
    const normalized = value.trim().toLowerCase();

    if (!CLUB_SLUG_PATTERN.test(normalized)) {
      throw new DomainRuleViolation(
        "invalid_club_slug",
        "Club slug must contain lowercase letters, numbers, and single hyphens.",
      );
    }

    this.value = normalized;
  }
}
