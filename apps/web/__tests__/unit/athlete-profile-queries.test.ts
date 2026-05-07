/**
 * @jest-environment node
 */

import { connection } from "next/server";
import {
  getCurrentAthleteProfile,
  mapAthleteEvolutionPoint,
} from "@/lib/athletes/profile";
import { prisma } from "@/lib/prisma";

jest.mock("react", () => ({
  cache: <Args extends unknown[], Result>(fn: (...args: Args) => Result) => fn,
}));

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    rankLevel: {
      findMany: jest.fn(),
    },
    matchHistory: {
      findMany: jest.fn(),
    },
  },
}));

const mockedConnection = jest.mocked(connection);
const mockedPrisma = jest.mocked(prisma);

describe("consultas de perfil de atleta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnection.mockResolvedValue(undefined);
    mockedPrisma.user.findFirst.mockResolvedValue({
      name: "Ana",
      athleteProfile: null,
      playerRanking: null,
    } as never);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-2",
        name: "Bruno",
        email: "bruno@example.com",
        playerRanking: {
          elo: 1100,
          wins: 3,
          total_matches: 4,
          winRate: 75,
        },
      },
      {
        id: "user-1",
        name: "Ana",
        email: "ana@example.com",
        playerRanking: null,
      },
    ] as never);
    mockedPrisma.rankLevel.findMany.mockResolvedValue([
      { name: "Bronze", minElo: 1000 },
      { name: "Prata", minElo: 1100 },
    ] as never);
    mockedPrisma.matchHistory.findMany.mockResolvedValue([] as never);
  });

  it("retorna campos editaveis vazios e valores fallback de ranking", async () => {
    await expect(
      getCurrentAthleteProfile("user-1", "tenant-1"),
    ).resolves.toMatchObject({
      editable: {
        name: "Ana",
        technicalLevel: null,
        gripStyle: null,
        playingStyle: null,
        bladeName: null,
      },
      ranking: {
        position: 2,
        elo: 1000,
        wins: 0,
        totalMatches: 0,
        winRate: 0,
        rankLevelName: "Bronze",
      },
      evolution: [],
    });

    expect(mockedPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1", tenantId: "tenant-1" },
      }),
    );
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1" },
      }),
    );
  });

  it("usa semantica de desempate do ranking publico para posicao interna", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-b",
        name: "Bruno",
        email: "bruno@example.com",
        playerRanking: { elo: 1200, wins: 2, total_matches: 3, winRate: 66.67 },
      },
      {
        id: "user-a",
        name: "Ana",
        email: "ana@example.com",
        playerRanking: { elo: 1200, wins: 2, total_matches: 3, winRate: 66.67 },
      },
      {
        id: "user-1",
        name: "Caio",
        email: "caio@example.com",
        playerRanking: { elo: 1200, wins: 2, total_matches: 3, winRate: 66.67 },
      },
    ] as never);
    mockedPrisma.user.findFirst.mockResolvedValue({
      name: "Caio",
      athleteProfile: null,
      playerRanking: { elo: 1200, wins: 2, total_matches: 3, winRate: 66.67 },
    } as never);

    await expect(
      getCurrentAthleteProfile("user-1", "tenant-1"),
    ).resolves.toMatchObject({
      ranking: {
        position: 3,
      },
    });
  });

  it("consulta historico recente de partidas limitado ao tenant e mapeia evolucao de vitorias/derrotas", async () => {
    const winMatch = {
      id: "match-win",
      winnerId: "user-1",
      loserId: "user-2",
      winnerOldElo: 1000,
      winnerNewElo: 1032,
      winnerDiffPoints: 32,
      loserOldElo: 1000,
      loserNewElo: 968,
      loserDiffPoints: -32,
      finishedAt: new Date("2026-05-01T12:00:00.000Z"),
      winner: { name: "Ana", email: "ana@example.com" },
      loser: { name: null, email: "bruno@example.com" },
    };
    const lossMatch = {
      id: "match-loss",
      winnerId: "user-3",
      loserId: "user-1",
      winnerOldElo: 1000,
      winnerNewElo: 1028,
      winnerDiffPoints: 28,
      loserOldElo: 1032,
      loserNewElo: 1004,
      loserDiffPoints: -28,
      finishedAt: new Date("2026-05-02T12:00:00.000Z"),
      winner: { name: "Carla", email: "carla@example.com" },
      loser: { name: "Ana", email: "ana@example.com" },
    };
    mockedPrisma.matchHistory.findMany.mockResolvedValue([
      lossMatch,
      winMatch,
    ] as never);

    await expect(
      getCurrentAthleteProfile("user-1", "tenant-1", { evolutionLimit: 2 }),
    ).resolves.toMatchObject({
      evolution: [
        {
          matchId: "match-loss",
          opponentName: "Carla",
          result: "loss",
          oldElo: 1032,
          newElo: 1004,
          diffPoints: -28,
        },
        {
          matchId: "match-win",
          opponentName: "bruno@example.com",
          result: "win",
          oldElo: 1000,
          newElo: 1032,
          diffPoints: 32,
        },
      ],
    });

    expect(mockedPrisma.matchHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: "tenant-1",
          kind: "match",
          OR: [{ winnerId: "user-1" }, { loserId: "user-1" }],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 2,
      }),
    );
  });

  it("mapeia identidade ausente do adversario para rotulo fallback", () => {
    expect(
      mapAthleteEvolutionPoint(
        {
          id: "match-1",
          winnerId: "user-1",
          loserId: "user-2",
          winnerOldElo: 1000,
          winnerNewElo: 1032,
          winnerDiffPoints: 32,
          loserOldElo: 1000,
          loserNewElo: 968,
          loserDiffPoints: -32,
          finishedAt: new Date("2026-05-01T12:00:00.000Z"),
          winner: { name: "Ana", email: "ana@example.com" },
          loser: { name: null, email: null },
        },
        "user-1",
      ),
    ).toMatchObject({
      opponentName: "Sem nome",
    });
  });
});
