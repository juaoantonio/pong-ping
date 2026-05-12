import { describe, expect, it } from "vitest";
import { ActorId, DomainRuleViolation } from "../../../shared/domain";
import { ClubId } from "../../../club/domain";
import { Athlete } from "../../domain/athlete";
import { ATHLETE_TECHNICAL_LEVEL } from "../../domain/value-objects/athlete-technical-level.enum";
import { AthleteDisplayName } from "../../domain/value-objects/athlete-display-name";
import { AthleteId } from "../../domain/value-objects/athlete-id";
import { type AthleteRepository } from "../../infrastructure/typeorm/repositories/athlete.repository";
import { RegisterAthleteUseCase } from "./register-athlete.use-case";
import { UpdateAthleteProfileUseCase } from "./update-athlete-profile.use-case";

class InMemoryAthleteRepository implements Pick<
  AthleteRepository,
  "findById" | "findByUserId" | "save"
> {
  public readonly athletes = new Map<string, Athlete>();

  public async findById(id: AthleteId): Promise<Athlete | null> {
    return this.athletes.get(id.value) ?? null;
  }

  public async findByUserId(userId: ActorId): Promise<Athlete | null> {
    return [...this.athletes.values()].find((athlete) => athlete.userId.equals(userId)) ?? null;
  }

  public async save(athlete: Athlete): Promise<Athlete> {
    this.athletes.set(athlete.id.value, athlete);
    return athlete;
  }
}

describe("use cases de atleta", () => {
  it("registra atleta vinculado a identidade de usuario", async () => {
    const repository = new InMemoryAthleteRepository();
    const useCase = new RegisterAthleteUseCase(repository as AthleteRepository);

    const athlete = await useCase.execute({
      id: "athlete-1",
      clubId: "club-1",
      userId: "user-1",
      displayName: "Nico Pong",
    });

    expect(athlete.userId.value).toBe("user-1");
    expect(await repository.findById(new AthleteId("athlete-1"))).toBe(athlete);
  });

  it("rejeita usuario ja registrado como atleta", async () => {
    const repository = new InMemoryAthleteRepository();
    await repository.save(
      Athlete.register({
        id: new AthleteId("athlete-1"),
        clubId: new ClubId("club-1"),
        userId: new ActorId("user-1"),
        displayName: new AthleteDisplayName("Nico Pong"),
      }),
    );
    const useCase = new RegisterAthleteUseCase(repository as AthleteRepository);

    await expect(
      useCase.execute({
        id: "athlete-2",
        clubId: "club-1",
        userId: "user-1",
        displayName: "Other Pong",
      }),
    ).rejects.toMatchObject({ code: "athlete_already_registered" });
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

    await expect(useCase.execute({ athleteId: "athlete-404", profile: {} })).rejects.toThrow(
      DomainRuleViolation,
    );
  });
});
