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

describe("clube", () => {
  it("cria clubes ativos com nome e slug normalizados", () => {
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

  it("renomeia e altera slug por metodos expressivos", () => {
    const club = createClub();

    club.rename(new ClubName("Night League"));
    club.changeSlug(new ClubSlug("night-league"));

    expect(club.name.value).toBe("Night League");
    expect(club.slug.value).toBe("night-league");
  });

  it("rejeita nomes e slugs invalidos", () => {
    expect(() => new ClubName("x")).toThrow(DomainRuleViolation);
    expect(() => new ClubSlug("-bad-")).toThrow(DomainRuleViolation);
  });

  it("protege operacoes entre clubes", () => {
    expect(() => createClub("club-1").ensureSameClub(new ClubId("club-2"))).toThrow(
      DomainRuleViolation,
    );
  });

  it("verifica unicidade de slug por contrato de servico de dominio", async () => {
    await expect(
      new ClubSlugUniquenessService().ensureUnique(new ClubSlug("central-pong"), async () => true),
    ).rejects.toMatchObject({ code: "club_slug_already_exists" });
  });
});
