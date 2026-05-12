import { describe, expect, it, vi } from "vitest";
import { ActorId } from "./shared/domain";
import { CoreIdentityTranslator } from "./application/identity";
import { ClubId } from "./club/domain";
import { AthleteCommandController } from "./athlete/athlete-command.controller";
import { Athlete, AthleteDisplayName, AthleteId } from "./athlete/domain";
import { TableCommandController } from "./table/table-command.controller";
import { Table } from "./table/domain";
import { GameSide, PlayMode, TableId, TableName } from "./table/domain";
import { CompetitionCommandController } from "./competition/competition-command.controller";
import { GameRecordId, type GameRecord, type SideRatingChange } from "./competition/domain";

const tenantContext = { id: "club-1", slug: "central-pong" };
const principal = {
  userId: "user-1",
  tenantId: "club-1",
  sessionId: "session-1",
  systemRoles: [],
  tenantRoles: ["member"],
};

function contextStub() {
  return {
    getTenantOrThrow: vi.fn(() => tenantContext),
    getPrincipalOrThrow: vi.fn(() => principal),
  };
}

function createAthlete(): Athlete {
  return Athlete.register({
    id: new AthleteId("athlete-1"),
    clubId: new ClubId("club-1"),
    userId: new ActorId("user-1"),
    displayName: new AthleteDisplayName("Nico Pong"),
  });
}

function createTable(): Table {
  return Table.create({
    id: new TableId("table-1"),
    clubId: new ClubId("club-1"),
    name: new TableName("Mesa 1"),
    playMode: new PlayMode("singles"),
    createdByAthleteId: new AthleteId("athlete-1"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
}

describe("controllers de comandos core", () => {
  it("atualiza perfil de atleta", async () => {
    const updateAthleteProfile = { execute: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new AthleteCommandController(updateAthleteProfile as never);

    const response = await controller.updateProfile("athlete-1", { displayName: "Nico Pong" });

    expect(updateAthleteProfile.execute).toHaveBeenCalledWith({
      athleteId: "athlete-1",
      displayName: "Nico Pong",
      profile: undefined,
    });
    expect(response).toMatchObject({ id: "athlete-1", userId: "user-1" });
  });

  it("cria mesa com tenant atual e atleta resolvido pelo principal", async () => {
    const createTableUseCase = { execute: vi.fn().mockResolvedValue(createTable()) };
    const athletes = { findByUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new TableCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      createTableUseCase as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    const response = await controller.create({ name: "Mesa 1", playMode: "singles" });

    expect(createTableUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        clubId: "club-1",
        name: "Mesa 1",
        playMode: "singles",
        createdByAthleteId: "athlete-1",
      }),
    );
    expect(response).toMatchObject({ id: "table-1", createdByAthleteId: "athlete-1" });
  });

  it("registra jogo com atleta atual como ator", async () => {
    const winningSide = GameSide.createSingles(new AthleteId("athlete-1"));
    const losingSide = GameSide.createSingles(new AthleteId("athlete-2"));
    const record = {
      id: new GameRecordId("game-1"),
      clubId: new ClubId("club-1"),
      tableId: new TableId("table-1"),
      winningSide,
      losingSide,
      ratingChanges: [] as SideRatingChange[],
      actorAthleteId: new AthleteId("athlete-1"),
      finishedAt: new Date("2026-01-01T00:00:00.000Z"),
      originalRecordId: null,
      correctionId: null,
      isCorrection: false,
    } as unknown as GameRecord;
    const recordGame = { execute: vi.fn().mockResolvedValue(record) };
    const athletes = { findByUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new CompetitionCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      recordGame as never,
      { execute: vi.fn() } as never,
    );

    const response = await controller.record("table-1", {
      winningAthleteIds: ["athlete-1"],
    });

    expect(recordGame.execute).toHaveBeenCalledWith({
      tableId: "table-1",
      winningAthleteIds: ["athlete-1"],
      actorAthleteId: "athlete-1",
    });
    expect(response).toMatchObject({ id: "game-1", actorAthleteId: "athlete-1" });
  });
});
