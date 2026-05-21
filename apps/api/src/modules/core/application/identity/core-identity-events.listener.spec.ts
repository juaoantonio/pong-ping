import { describe, expect, it } from "vitest";
import { RegisterAthleteUseCase } from "../../athlete/application/use-cases";
import type { Athlete } from "../../athlete/domain";
import type { AthleteId } from "../../athlete/domain/value-objects/athlete-id";
import { type AthleteRepository } from "../../athlete/infrastructure/typeorm/repositories/athlete.repository";
import {
  ActivateClubUseCase,
  ChangeClubSlugUseCase,
  CreateClubUseCase,
  DeactivateClubUseCase,
  RenameClubUseCase,
} from "../../club/application/use-cases";
import { Club, ClubId, ClubName, ClubSlug } from "../../club/domain";
import { type ClubRepository } from "../../club/infrastructure/typeorm/repositories/club.repository";
import { Rating } from "../../rating/domain";
import { type RatingRepository } from "../../rating/infrastructure/typeorm/repositories/rating.repository";
import { ActorId } from "../../shared/domain";
import { CoreIdentityEventsListener } from "./core-identity-events.listener";

describe("listener de eventos de identidade do core", () => {
  it("cria clube quando tenant e criado", async () => {
    const { listener, clubs } = createListener();

    await listener.handleTenantCreated({
      tenantId: "club-1",
      name: "Central Pong",
      slug: "central-pong",
      active: true,
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const club = await clubs.findById(new ClubId("club-1"));
    expect(club).toMatchObject({ active: true });
    expect(club?.name.value).toBe("Central Pong");
    expect(club?.slug.value).toBe("central-pong");
  });

  it("sincroniza nome, slug e estado ativo quando tenant e atualizado", async () => {
    const { listener, clubs } = createListener();
    await clubs.save(
      Club.create({
        id: new ClubId("club-1"),
        name: new ClubName("Central Pong"),
        slug: new ClubSlug("central-pong"),
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
    );

    await listener.handleTenantUpdated({
      tenantId: "club-1",
      name: "Night League",
      slug: "night-league",
      active: false,
      occurredAt: new Date("2026-01-02T00:00:00.000Z"),
    });
    let club = await clubs.findById(new ClubId("club-1"));
    expect(club?.name.value).toBe("Night League");
    expect(club?.slug.value).toBe("night-league");
    expect(club?.active).toBe(false);

    await listener.handleTenantUpdated({
      tenantId: "club-1",
      name: "Night League",
      slug: "night-league",
      active: true,
      occurredAt: new Date("2026-01-03T00:00:00.000Z"),
    });
    club = await clubs.findById(new ClubId("club-1"));
    expect(club?.active).toBe(true);
  });

  it("cria clube ausente quando tenant atualizado ainda nao existe no core", async () => {
    const { listener, clubs } = createListener();

    await listener.handleTenantUpdated({
      tenantId: "club-1",
      name: "Central Pong",
      slug: "central-pong",
      active: false,
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const club = await clubs.findById(new ClubId("club-1"));
    expect(club?.name.value).toBe("Central Pong");
    expect(club?.active).toBe(false);
  });

  it("cria atleta e rating padrao no primeiro login de usuario do tenant", async () => {
    const { listener, athletes, ratings } = createListener();

    await listener.handleTenantUserAuthenticated({
      tenantId: "club-1",
      userId: "user-1",
      displayName: null,
      email: "player@example.test",
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const athlete = await athletes.findByUserId(new ActorId("user-1"));
    expect(athlete?.clubId.value).toBe("club-1");
    expect(athlete?.displayName.value).toBe("player");
    const rating = athlete ? await ratings.findByAthleteId(athlete.id) : null;
    expect(rating?.clubId.value).toBe("club-1");
    expect(rating?.points.value).toBe(1000);
    expect(rating?.wins).toBe(0);
    expect(rating?.totalMatches).toBe(0);
  });

  it("ignora login repetido para usuario que ja tem atleta", async () => {
    const { listener, athletes, ratings } = createListener();
    const event = {
      tenantId: "club-1",
      userId: "user-1",
      displayName: "Nico Pong",
      email: "nico@example.test",
      occurredAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    await listener.handleTenantUserAuthenticated(event);
    await listener.handleTenantUserAuthenticated(event);

    expect(athletes.athletes).toHaveLength(1);
    expect(ratings.ratings.size).toBe(1);
    expect(athletes.athletes[0]?.displayName.value).toBe("Nico Pong");
  });
});

function createListener() {
  const clubs = new InMemoryClubRepository();
  const athletes = new InMemoryAthleteRepository();
  const ratings = new InMemoryRatingRepository();

  return {
    clubs,
    athletes,
    ratings,
    listener: new CoreIdentityEventsListener(
      clubs as ClubRepository,
      athletes as AthleteRepository,
      new CreateClubUseCase(clubs as ClubRepository),
      new RenameClubUseCase(clubs as ClubRepository),
      new ChangeClubSlugUseCase(clubs as ClubRepository),
      new ActivateClubUseCase(clubs as ClubRepository),
      new DeactivateClubUseCase(clubs as ClubRepository),
      new RegisterAthleteUseCase(athletes as AthleteRepository, ratings as RatingRepository),
    ),
  };
}

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

class InMemoryAthleteRepository implements Pick<
  AthleteRepository,
  "findById" | "findByUserId" | "save"
> {
  public readonly athletes: Athlete[] = [];

  public async findById(id: AthleteId): Promise<Athlete | null> {
    return this.athletes.find((athlete) => athlete.id.equals(id)) ?? null;
  }

  public async findByUserId(userId: ActorId): Promise<Athlete | null> {
    return this.athletes.find((athlete) => athlete.userId.equals(userId)) ?? null;
  }

  public async save(athlete: Athlete): Promise<Athlete> {
    const index = this.athletes.findIndex((candidate) => candidate.id.equals(athlete.id));
    if (index === -1) {
      this.athletes.push(athlete);
    } else {
      this.athletes[index] = athlete;
    }
    return athlete;
  }
}

class InMemoryRatingRepository implements Pick<
  RatingRepository,
  "findByAthleteId" | "getOrCreate" | "save"
> {
  public readonly ratings = new Map<string, Rating>();

  public async findByAthleteId(athleteId: AthleteId): Promise<Rating | null> {
    return this.ratings.get(athleteId.value) ?? null;
  }

  public async getOrCreate(clubId: ClubId, athleteId: AthleteId): Promise<Rating> {
    const current = await this.findByAthleteId(athleteId);
    if (current) return current;

    return Rating.createDefault({ clubId, athleteId });
  }

  public async save(rating: Rating): Promise<Rating> {
    this.ratings.set(rating.athleteId.value, rating);
    return rating;
  }
}
