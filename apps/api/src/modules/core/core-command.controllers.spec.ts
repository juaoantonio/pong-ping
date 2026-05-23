import { ForbiddenException } from "@nestjs/common";
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

function contextStub(input?: { principal?: typeof principal }) {
  return {
    getTenantOrThrow: vi.fn(() => tenantContext),
    getPrincipalOrThrow: vi.fn(() => input?.principal ?? principal),
  };
}

function createAthlete(input?: {
  id?: string;
  clubId?: string;
  userId?: string;
  displayName?: string;
}): Athlete {
  return Athlete.register({
    id: new AthleteId(input?.id ?? "athlete-1"),
    clubId: new ClubId(input?.clubId ?? "club-1"),
    userId: new ActorId(input?.userId ?? "user-1"),
    displayName: new AthleteDisplayName(input?.displayName ?? "Nico Pong"),
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

function queuedTable(athleteId = "athlete-1") {
  const table = createTable();
  const queueEntry = table.enqueue(new AthleteId(athleteId)).queueEntry;

  return { queueEntry, table };
}

describe("controllers de comandos core", () => {
  it("atualiza o proprio perfil de atleta como membro", async () => {
    const updateAthleteProfile = { execute: vi.fn().mockResolvedValue(createAthlete()) };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new AthleteCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      updateAthleteProfile as never,
    );

    const response = await controller.updateProfile("athlete-1", { displayName: "Nico Pong" });

    expect(updateAthleteProfile.execute).toHaveBeenCalledWith({
      clubId: "club-1",
      athleteId: "athlete-1",
      displayName: "Nico Pong",
      profile: undefined,
    });
    expect(response).toMatchObject({ id: "athlete-1", userId: "user-1" });
  });

  it("nega membro editando perfil de outro atleta", async () => {
    const updateAthleteProfile = { execute: vi.fn() };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new AthleteCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      updateAthleteProfile as never,
    );

    await expect(
      controller.updateProfile("athlete-2", { displayName: "Other Pong" }),
    ).rejects.toThrow(ForbiddenException);
    expect(updateAthleteProfile.execute).not.toHaveBeenCalled();
  });

  it("nega admin editando perfil de outro atleta", async () => {
    const updateAthleteProfile = { execute: vi.fn() };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new AthleteCommandController(
      contextStub({
        principal: {
          ...principal,
          tenantRoles: ["admin"],
        },
      }) as never,
      new CoreIdentityTranslator(),
      athletes as never,
      updateAthleteProfile as never,
    );

    await expect(
      controller.updateProfile("athlete-2", { displayName: "Other Pong" }),
    ).rejects.toThrow(ForbiddenException);
    expect(updateAthleteProfile.execute).not.toHaveBeenCalled();
  });

  it("rejeita atualizacao de perfil quando atleta atual nao existe", async () => {
    const updateAthleteProfile = { execute: vi.fn() };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(null) };
    const controller = new AthleteCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      updateAthleteProfile as never,
    );

    await expect(
      controller.updateProfile("athlete-1", { displayName: "Nico Pong" }),
    ).rejects.toMatchObject({ code: "athlete_not_found" });
    expect(updateAthleteProfile.execute).not.toHaveBeenCalled();
  });

  it("cria mesa com tenant atual e atleta resolvido pelo principal", async () => {
    const createTableUseCase = { execute: vi.fn().mockResolvedValue(createTable()) };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
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

  it("permite membro remover a si mesmo da fila", async () => {
    const output = queuedTable("athlete-1");
    const removeFromQueue = { execute: vi.fn().mockResolvedValue({ table: output.table, removedEntry: output.queueEntry }) };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new TableCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      removeFromQueue as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    await controller.removeQueued("table-1", "athlete-1");

    expect(removeFromQueue.execute).toHaveBeenCalledWith({
      clubId: "club-1",
      tableId: "table-1",
      athleteId: "athlete-1",
    });
  });

  it("nega membro removendo outro atleta da fila", async () => {
    const removeFromQueue = { execute: vi.fn() };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new TableCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      removeFromQueue as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    await expect(controller.removeQueued("table-1", "athlete-2")).rejects.toThrow(
      ForbiddenException,
    );
    expect(removeFromQueue.execute).not.toHaveBeenCalled();
  });

  it("permite admin remover outro atleta da fila", async () => {
    const output = queuedTable("athlete-2");
    const removeFromQueue = { execute: vi.fn().mockResolvedValue({ table: output.table, removedEntry: output.queueEntry }) };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new TableCommandController(
      contextStub({
        principal: {
          ...principal,
          tenantRoles: ["admin"],
        },
      }) as never,
      new CoreIdentityTranslator(),
      athletes as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      removeFromQueue as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    await controller.removeQueued("table-1", "athlete-2");

    expect(removeFromQueue.execute).toHaveBeenCalledWith({
      clubId: "club-1",
      tableId: "table-1",
      athleteId: "athlete-2",
    });
  });

  it("aplica politica self/admin ao remover atleta do jogo ativo", async () => {
    const output = queuedTable("athlete-1");
    const removeFromActiveGame = {
      execute: vi.fn().mockResolvedValue({ table: output.table, removedEntry: output.queueEntry }),
    };
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
    const controller = new TableCommandController(
      contextStub() as never,
      new CoreIdentityTranslator(),
      athletes as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
      removeFromActiveGame as never,
      { execute: vi.fn() } as never,
      { execute: vi.fn() } as never,
    );

    await controller.removeActive("table-1", "athlete-1");

    expect(removeFromActiveGame.execute).toHaveBeenCalledWith({
      clubId: "club-1",
      tableId: "table-1",
      athleteId: "athlete-1",
    });
    await expect(controller.removeActive("table-1", "athlete-2")).rejects.toThrow(
      ForbiddenException,
    );
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
    const athletes = { findByClubAndUserId: vi.fn().mockResolvedValue(createAthlete()) };
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
