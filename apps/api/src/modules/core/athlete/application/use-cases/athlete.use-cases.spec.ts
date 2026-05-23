import { describe, expect, it } from "vitest";
import { ActorId, DomainRuleViolation } from "../../../shared/domain";
import { ClubId } from "../../../club/domain";
import { Athlete } from "../../domain/athlete";
import { ATHLETE_TECHNICAL_LEVEL } from "../../domain/value-objects/athlete-technical-level.enum";
import { AthleteDisplayName } from "../../domain/value-objects/athlete-display-name";
import { AthleteId } from "../../domain/value-objects/athlete-id";
import { type AthleteRepository } from "../../infrastructure/typeorm/repositories/athlete.repository";
import { Rating } from "../../../rating/domain";
import { type RatingRepository } from "../../../rating/infrastructure/typeorm/repositories/rating.repository";
import { RegisterAthleteUseCase } from "./register-athlete.use-case";
import { UpdateAthleteProfileUseCase } from "./update-athlete-profile.use-case";

class InMemoryAthleteRepository implements Pick<
  AthleteRepository,
  "findById" | "findByUserId" | "findByClubAndUserId" | "save"
> {
  public readonly athletes = new Map<string, Athlete>();

  public async findById(id: AthleteId): Promise<Athlete | null> {
    return this.athletes.get(id.value) ?? null;
  }

  public async findByUserId(userId: ActorId): Promise<Athlete | null> {
    return [...this.athletes.values()].find((athlete) => athlete.userId.equals(userId)) ?? null;
  }

  public async findByClubAndUserId(
    clubId: ClubId,
    userId: ActorId,
  ): Promise<Athlete | null> {
    return [...this.athletes.values()].find((athlete) =>
      athlete.clubId.equals(clubId) && athlete.userId.equals(userId)
    ) ?? null;
  }

  public async save(athlete: Athlete): Promise<Athlete> {
    this.athletes.set(athlete.id.value, athlete);
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

describe("use cases de atleta", () => {
  it("registra atleta vinculado a identidade de usuario e cria rating padrao", async () => {
    const repository = new InMemoryAthleteRepository();
    const ratings = new InMemoryRatingRepository();
    const useCase = new RegisterAthleteUseCase(
      repository as AthleteRepository,
      ratings as RatingRepository,
    );

    const athlete = await useCase.execute({
      id: "athlete-1",
      clubId: "club-1",
      userId: "user-1",
      displayName: "Nico Pong",
    });

    expect(athlete.userId.value).toBe("user-1");
    expect(await repository.findById(new AthleteId("athlete-1"))).toBe(athlete);
    const rating = await ratings.findByAthleteId(new AthleteId("athlete-1"));
    expect(rating?.points.value).toBe(1000);
    expect(rating?.wins).toBe(0);
    expect(rating?.totalMatches).toBe(0);
  });

  it("rejeita usuario ja registrado como atleta no mesmo clube sem criar rating", async () => {
    const repository = new InMemoryAthleteRepository();
    const ratings = new InMemoryRatingRepository();
    await repository.save(
      Athlete.register({
        id: new AthleteId("athlete-1"),
        clubId: new ClubId("club-1"),
        userId: new ActorId("user-1"),
        displayName: new AthleteDisplayName("Nico Pong"),
      }),
    );
    const useCase = new RegisterAthleteUseCase(
      repository as AthleteRepository,
      ratings as RatingRepository,
    );

    await expect(
      useCase.execute({
        id: "athlete-2",
        clubId: "club-1",
        userId: "user-1",
        displayName: "Other Pong",
      }),
    ).rejects.toMatchObject({ code: "athlete_already_registered" });
    expect(ratings.ratings.size).toBe(0);
  });

  it("permite mesmo usuario registrado como atleta em clubes diferentes", async () => {
    const repository = new InMemoryAthleteRepository();
    const ratings = new InMemoryRatingRepository();
    await repository.save(
      Athlete.register({
        id: new AthleteId("athlete-1"),
        clubId: new ClubId("club-1"),
        userId: new ActorId("user-1"),
        displayName: new AthleteDisplayName("Nico Pong"),
      }),
    );
    const useCase = new RegisterAthleteUseCase(
      repository as AthleteRepository,
      ratings as RatingRepository,
    );

    const athlete = await useCase.execute({
      id: "athlete-2",
      clubId: "club-2",
      userId: "user-1",
      displayName: "Nico Spin",
    });

    expect(athlete.clubId.value).toBe("club-2");
    expect(athlete.userId.value).toBe("user-1");
    expect(ratings.ratings.size).toBe(1);
  });

  it("atualiza perfil tecnico e nome de exibicao", async () => {
    const repository = new InMemoryAthleteRepository();
    await repository.save(
      Athlete.register({
        id: new AthleteId("athlete-1"),
        clubId: new ClubId("club-1"),
        userId: new ActorId("user-1"),
        displayName: new AthleteDisplayName("Nico Pong"),
      }),
    );
    const useCase = new UpdateAthleteProfileUseCase(repository as AthleteRepository);

    const athlete = await useCase.execute({
      clubId: "club-1",
      athleteId: "athlete-1",
      displayName: "Nico Spin",
      profile: {
        technicalLevel: ATHLETE_TECHNICAL_LEVEL.ADVANCED,
        bladeName: "Carbon Blade",
      },
    });

    expect(athlete.displayName.value).toBe("Nico Spin");
    expect(athlete.profile.technicalLevel).toBe(ATHLETE_TECHNICAL_LEVEL.ADVANCED);
    expect(athlete.profile.bladeName?.value).toBe("Carbon Blade");
  });

  it("rejeita atualizacao de atleta inexistente", async () => {
    const useCase = new UpdateAthleteProfileUseCase(
      new InMemoryAthleteRepository() as AthleteRepository,
    );

    await expect(
      useCase.execute({ clubId: "club-1", athleteId: "athlete-404", profile: {} }),
    ).rejects.toThrow(DomainRuleViolation);
  });

  it("rejeita atualizacao de atleta fora do clube atual", async () => {
    const repository = new InMemoryAthleteRepository();
    await repository.save(
      Athlete.register({
        id: new AthleteId("athlete-1"),
        clubId: new ClubId("club-2"),
        userId: new ActorId("user-1"),
        displayName: new AthleteDisplayName("Nico Pong"),
      }),
    );
    const useCase = new UpdateAthleteProfileUseCase(repository as AthleteRepository);

    await expect(
      useCase.execute({
        clubId: "club-1",
        athleteId: "athlete-1",
        displayName: "Nico Spin",
        profile: {},
      }),
    ).rejects.toMatchObject({ code: "athlete_not_found" });
  });
});
