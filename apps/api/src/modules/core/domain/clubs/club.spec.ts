import { describe, expect, it } from "vitest";
import { DomainRuleViolation } from "../shared";
import { Club } from "./club";
import { ClubSlugUniquenessService } from "./club-slug-uniqueness.service";
import { ClubId } from "./value-objects/club-id";
import { ClubName } from "./value-objects/club-name";
import { ClubSlug } from "./value-objects/club-slug";

function createClub(id = "club-1") {
  return Club.create({
    id: new ClubId(id),
    name: new ClubName("Central Pong"),
    slug: new ClubSlug("central-pong"),
    createdAt: new Date("2026-01-01"),
  });
}

describe("Club", () => {
  it("creates active clubs with normalized name and slug", () => {
    const club = Club.create({
      id: new ClubId(" club-1 "),
      name: new ClubName("  Central   Pong  "),
      slug: new ClubSlug("Central-Pong"),
      createdAt: new Date("2026-01-01"),
    });

    expect(club.active).toBe(true);
    expect(club.name.value).toBe("Central Pong");
    expect(club.slug.value).toBe("central-pong");
  });

  it("renames and changes slug through expressive methods", () => {
    const club = createClub();

    club.rename(new ClubName("Night League"));
    club.changeSlug(new ClubSlug("night-league"));

    expect(club.name.value).toBe("Night League");
    expect(club.slug.value).toBe("night-league");
  });

  it("rejects invalid names and slugs", () => {
    expect(() => new ClubName("x")).toThrow(DomainRuleViolation);
    expect(() => new ClubSlug("-bad-")).toThrow(DomainRuleViolation);
  });

  it("guards cross-club operations", () => {
    expect(() => createClub("club-1").ensureSameClub(new ClubId("club-2"))).toThrow(
      DomainRuleViolation,
    );
  });

  it("checks slug uniqueness through a domain service contract", async () => {
    await expect(
      new ClubSlugUniquenessService().ensureUnique(new ClubSlug("central-pong"), async () => true),
    ).rejects.toMatchObject({ code: "club_slug_already_exists" });
  });
});
