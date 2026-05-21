import { describe, expect, it, vi } from "vitest";
import { Athlete, AthleteDisplayName, AthleteId } from "./athlete/domain";
import { AthleteReadQuery } from "./athlete/presentation/http/queries/athlete-read.query";
import { Club, ClubId, ClubName, ClubSlug } from "./club/domain";
import { ClubReadQuery } from "./club/presentation/http/queries/club-read.query";
import { GameRecord, GameRecordId, SideRatingChange } from "./competition/domain";
import { GameReadQuery } from "./competition/presentation/http/queries/game-read.query";
import { CoreDashboardReadQuery } from "./presentation/http/queries/core-dashboard-read.query";
import { Rating } from "./rating/domain";
import { RatingPoints } from "./rating/domain/value-objects/rating-points";
import { RatingReadQuery } from "./rating/presentation/http/queries/rating-read.query";
import { ActorId, DomainRuleViolation } from "./shared/domain";
import { ActiveGame, GameSide, PlayMode, Table, TableId, TableName } from "./table/domain";
import { TableReadQuery } from "./table/presentation/http/queries/table-read.query";

function repositoryStub<T extends object>(partial: T): T {
  return partial;
}

function createAthlete(input: {
  id: string;
  clubId?: string;
  displayName?: string;
  userId?: string;
}) {
  return Athlete.register({
    id: new AthleteId(input.id),
    clubId: new ClubId(input.clubId ?? "club-1"),
    userId: new ActorId(input.userId ?? `user-${input.id}`),
    displayName: new AthleteDisplayName(input.displayName ?? input.id),
  });
}

function createClub() {
  return Club.create({
    id: new ClubId("club-1"),
    name: new ClubName("Central Pong"),
    slug: new ClubSlug("central-pong"),
    createdAt: new Date("2026-05-20T09:00:00.000Z"),
  });
}

function createTable(input: { id: string; clubId?: string; queuedAthleteIds?: string[] }) {
  const table = Table.create({
    id: new TableId(input.id),
    clubId: new ClubId(input.clubId ?? "club-1"),
    name: new TableName(input.id === "table-1" ? "Mesa 1" : "Mesa 2"),
    playMode: new PlayMode("singles"),
    createdByAthleteId: new AthleteId("athlete-creator"),
    createdAt: new Date(`2026-05-20T10:0${input.id.endsWith("1") ? "0" : "1"}:00.000Z`),
  });

  for (const athleteId of input.queuedAthleteIds ?? []) {
    table.enqueue(new AthleteId(athleteId), new Date("2026-05-20T10:10:00.000Z"));
  }

  return table;
}

function createRating(input: {
  athleteId: string;
  points: number;
  wins: number;
  totalMatches: number;
}) {
  return Rating.restore({
    clubId: new ClubId("club-1"),
    athleteId: new AthleteId(input.athleteId),
    points: new RatingPoints(input.points),
    wins: input.wins,
    totalMatches: input.totalMatches,
  });
}

function createGameRecord() {
  const playMode = new PlayMode("singles");
  const firstSide = GameSide.createSingles(new AthleteId("athlete-1"));
  const secondSide = GameSide.createSingles(new AthleteId("athlete-2"));
  const activeGame = ActiveGame.create({ playMode, firstSide, secondSide });

  return GameRecord.record({
    id: new GameRecordId("game-1"),
    clubId: new ClubId("club-1"),
    tableId: new TableId("table-1"),
    activeGame,
    winningSide: firstSide,
    ratingChanges: [
      new SideRatingChange(firstSide, [
        {
          athleteId: new AthleteId("athlete-1"),
          delta: { points: 16, wins: 1, totalMatches: 1 } as never,
        },
      ]),
      new SideRatingChange(secondSide, [
        {
          athleteId: new AthleteId("athlete-2"),
          delta: { points: -16, wins: 0, totalMatches: 1 } as never,
        },
      ]),
    ],
    actorAthleteId: new AthleteId("athlete-1"),
    finishedAt: new Date("2026-05-20T11:00:00.000Z"),
  });
}

describe("queries de leitura core", () => {
  it("consulta clube atual com tenant scope e serializacao", async () => {
    const club = createClub();
    const clubs = repositoryStub({ findOneBy: vi.fn().mockResolvedValue(club) });
    const query = new ClubReadQuery(clubs as never);

    const response = await query.getCurrentClub("club-1");

    expect(clubs.findOneBy).toHaveBeenCalledWith({ id: new ClubId("club-1") });
    expect(response).toEqual({
      id: "club-1",
      name: "Central Pong",
      slug: "central-pong",
      active: true,
      createdAt: "2026-05-20T09:00:00.000Z",
    });
  });

  it("rejeita clube atual ausente", async () => {
    const clubs = repositoryStub({ findOneBy: vi.fn().mockResolvedValue(null) });
    const query = new ClubReadQuery(clubs as never);

    await expect(query.getCurrentClub("club-1")).rejects.toThrow(DomainRuleViolation);
  });

  it("lista mesas com tenant scope, paginacao e serializacao", async () => {
    const table = createTable({ id: "table-1", queuedAthleteIds: ["athlete-1", "athlete-2"] });
    const tables = repositoryStub({
      findAndCount: vi.fn().mockResolvedValue([[table], 3]),
    });
    const query = new TableReadQuery(tables as never);

    const response = await query.listTables("club-1", { page: 2, pageSize: 1 });

    expect(tables.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { createdAt: "DESC" },
        skip: 1,
        take: 1,
        where: { clubId: new ClubId("club-1") },
      }),
    );
    expect(response.page).toEqual({ page: 2, pageSize: 1, totalItems: 3, totalPages: 3 });
    expect(response.items[0]).toMatchObject({
      id: "table-1",
      clubId: "club-1",
      queue: [
        { athleteId: "athlete-1", position: 0 },
        { athleteId: "athlete-2", position: 1 },
      ],
      activeGame: {
        firstSide: { athleteIds: ["athlete-1"] },
        secondSide: { athleteIds: ["athlete-2"] },
      },
    });
  });

  it("bloqueia detalhe de mesa fora do tenant atual", async () => {
    const tables = repositoryStub({ findOneBy: vi.fn().mockResolvedValue(null) });
    const query = new TableReadQuery(tables as never);

    await expect(query.getTableDetail("club-1", "table-2")).rejects.toThrow(DomainRuleViolation);

    expect(tables.findOneBy).toHaveBeenCalledWith({
      clubId: new ClubId("club-1"),
      id: new TableId("table-2"),
    });
  });

  it("consulta atleta atual pelo tenant e user id", async () => {
    const athlete = createAthlete({
      id: "athlete-1",
      displayName: "Nico Pong",
      userId: "user-1",
    });
    const athletes = repositoryStub({ findOneBy: vi.fn().mockResolvedValue(athlete) });
    const query = new AthleteReadQuery(athletes as never);

    const response = await query.getCurrentAthlete("club-1", "user-1");

    expect(athletes.findOneBy).toHaveBeenCalledWith({
      clubId: new ClubId("club-1"),
      userId: new ActorId("user-1"),
    });
    expect(response).toMatchObject({
      id: "athlete-1",
      displayName: "Nico Pong",
      profile: {
        technicalLevel: null,
        gripStyle: null,
        playingStyle: null,
      },
    });
  });

  it("lista ranking ordenado por pontos e inclui nome do atleta", async () => {
    const ratingsRepository = repositoryStub({
      findAndCount: vi
        .fn()
        .mockResolvedValue([
          [createRating({ athleteId: "athlete-1", points: 1040, wins: 3, totalMatches: 4 })],
          1,
        ]),
    });
    const athletesRepository = repositoryStub({
      findBy: vi.fn().mockResolvedValue([
        {
          id: new AthleteId("athlete-1"),
          displayName: { value: "Nico Pong" },
        },
      ]),
    });
    const query = new RatingReadQuery(ratingsRepository as never, athletesRepository as never);

    const response = await query.listRatings("club-1", { page: 1, pageSize: 20 });

    expect(ratingsRepository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { pointsValue: "DESC" },
        skip: 0,
        take: 20,
        where: { clubId: new ClubId("club-1") },
      }),
    );
    expect(athletesRepository.findBy).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(Object) }),
    );
    expect(response.items).toEqual([
      {
        athleteId: "athlete-1",
        athleteDisplayName: "Nico Pong",
        points: 1040,
        wins: 3,
        totalMatches: 4,
        winRate: 75,
        tier: null,
      },
    ]);
  });

  it("lista historico de jogos com tenant scope e data serializada", async () => {
    const record = createGameRecord();
    const records = repositoryStub({ findAndCount: vi.fn().mockResolvedValue([[record], 1]) });
    const query = new GameReadQuery(records as never);

    const response = await query.listGames("club-1", { page: 1, pageSize: 10 });

    expect(records.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        order: { finishedAt: "DESC" },
        skip: 0,
        take: 10,
        where: { clubIdValue: new ClubId("club-1") },
      }),
    );
    expect(response.items[0]).toMatchObject({
      id: "game-1",
      clubId: "club-1",
      tableId: "table-1",
      winningSide: { athleteIds: ["athlete-1"] },
      losingSide: { athleteIds: ["athlete-2"] },
      finishedAt: "2026-05-20T11:00:00.000Z",
    });
  });

  it("agrega resumo do dashboard a partir das queries de leitura", async () => {
    const query = new CoreDashboardReadQuery(
      {
        listTablesForDashboard: vi.fn().mockResolvedValue([
          { queue: [{ athleteId: "athlete-1" }, { athleteId: "athlete-2" }], activeGame: {} },
          { queue: [], activeGame: null },
        ]),
      } as never,
      { countAthletes: vi.fn().mockResolvedValue(7) } as never,
      { listRatings: vi.fn().mockResolvedValue({ items: [{ athleteId: "athlete-1" }] }) } as never,
      { listGames: vi.fn().mockResolvedValue({ items: [{ id: "game-1" }] }) } as never,
    );

    await expect(query.getDashboard("club-1")).resolves.toEqual({
      tables: {
        totalTables: 2,
        activeTables: 1,
        queuedAthletes: 2,
        tables: [
          { queue: [{ athleteId: "athlete-1" }, { athleteId: "athlete-2" }], activeGame: {} },
          { queue: [], activeGame: null },
        ],
      },
      activeAthleteCount: 7,
      recentGames: [{ id: "game-1" }],
      ranking: [{ athleteId: "athlete-1" }],
    });
  });
});
