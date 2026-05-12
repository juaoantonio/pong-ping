import { describe, expect, it } from "vitest";
import { DomainRuleViolation } from "../../../shared/domain";
import { Club } from "../../domain/club";
import { ClubId } from "../../domain/value-objects/club-id";
import { ClubName } from "../../domain/value-objects/club-name";
import { ClubSlug } from "../../domain/value-objects/club-slug";
import { type ClubRepository } from "../../infrastructure/typeorm/repositories/club.repository";
import { ActivateClubUseCase } from "./activate-club.use-case";
import { ChangeClubSlugUseCase } from "./change-club-slug.use-case";
import { CreateClubUseCase } from "./create-club.use-case";
import { DeactivateClubUseCase } from "./deactivate-club.use-case";
import { RenameClubUseCase } from "./rename-club.use-case";

class InMemoryClubRepository implements Pick<ClubRepository, "existsBySlug" | "findById" | "save"> {
  public readonly clubs = new Map<string, Club>();

  public async existsBySlug(slug: ClubSlug): Promise<boolean> {
    return [...this.clubs.values()].some((club) => club.slug.value === slug.value);
  }

  public async findById(id: ClubId): Promise<Club | null> {
    return this.clubs.get(id.value) ?? null;
  }

  public async save(club: Club): Promise<Club> {
    this.clubs.set(club.id.value, club);
    return club;
  }
}

describe("use cases de clube", () => {
  it("cria clube com slug unico e persiste", async () => {
    const repository = new InMemoryClubRepository();
    const useCase = new CreateClubUseCase(repository as ClubRepository);

    const club = await useCase.execute({
      id: "club-1",
      name: "Central Pong",
      slug: "central-pong",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    expect(club.id.value).toBe("club-1");
    expect(await repository.findById(new ClubId("club-1"))).toBe(club);
  });

  it("rejeita criacao com slug duplicado", async () => {
    const repository = new InMemoryClubRepository();
    await repository.save(
      Club.create({
        id: new ClubId("club-1"),
        name: new ClubName("Central Pong"),
        slug: new ClubSlug("central-pong"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    const useCase = new CreateClubUseCase(repository as ClubRepository);

    await expect(
      useCase.execute({
        id: "club-2",
        name: "Other Pong",
        slug: "central-pong",
      }),
    ).rejects.toMatchObject({ code: "club_slug_already_exists" });
  });

  it("renomeia clube existente", async () => {
    const repository = new InMemoryClubRepository();
    const club = Club.create({
      id: new ClubId("club-1"),
      name: new ClubName("Central Pong"),
      slug: new ClubSlug("central-pong"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await repository.save(club);
    const useCase = new RenameClubUseCase(repository as ClubRepository);

    const renamed = await useCase.execute({ clubId: "club-1", name: "Night League" });

    expect(renamed.name.value).toBe("Night League");
  });

  it("rejeita renomear clube inexistente", async () => {
    const useCase = new RenameClubUseCase(new InMemoryClubRepository() as ClubRepository);

    await expect(useCase.execute({ clubId: "club-404", name: "Night League" })).rejects.toThrow(
      DomainRuleViolation,
    );
  });

  it("altera slug de clube existente com unicidade", async () => {
    const repository = new InMemoryClubRepository();
    const club = Club.create({
      id: new ClubId("club-1"),
      name: new ClubName("Central Pong"),
      slug: new ClubSlug("central-pong"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await repository.save(club);
    const useCase = new ChangeClubSlugUseCase(repository as ClubRepository);

    const updated = await useCase.execute({ clubId: "club-1", slug: "night-league" });

    expect(updated.slug.value).toBe("night-league");
    expect(await repository.findById(new ClubId("club-1"))).toBe(updated);
  });

  it("rejeita alterar slug para valor duplicado", async () => {
    const repository = new InMemoryClubRepository();
    await repository.save(
      Club.create({
        id: new ClubId("club-1"),
        name: new ClubName("Central Pong"),
        slug: new ClubSlug("central-pong"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    await repository.save(
      Club.create({
        id: new ClubId("club-2"),
        name: new ClubName("Night League"),
        slug: new ClubSlug("night-league"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );
    const useCase = new ChangeClubSlugUseCase(repository as ClubRepository);

    await expect(useCase.execute({ clubId: "club-1", slug: "night-league" })).rejects.toMatchObject(
      { code: "club_slug_already_exists" },
    );
  });

  it("ativa e desativa clube existente", async () => {
    const repository = new InMemoryClubRepository();
    const club = Club.create({
      id: new ClubId("club-1"),
      name: new ClubName("Central Pong"),
      slug: new ClubSlug("central-pong"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    await repository.save(club);
    const deactivate = new DeactivateClubUseCase(repository as ClubRepository);
    const activate = new ActivateClubUseCase(repository as ClubRepository);

    expect((await deactivate.execute({ clubId: "club-1" })).active).toBe(false);
    expect((await activate.execute({ clubId: "club-1" })).active).toBe(true);
  });
});
