/**
 * @jest-environment node
 */

import { connection } from "next/server";
import { getAdminRoundsReadModel } from "@/lib/contexts/competition/queries";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    matchHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockedConnection = jest.mocked(connection);
const mockedPrisma = jest.mocked(prisma);

describe("consulta admin de rodadas de competicao", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnection.mockResolvedValue(undefined);
    mockedPrisma.matchHistory.count.mockResolvedValue(26);
    mockedPrisma.matchHistory.findMany.mockResolvedValue([]);
  });

  it("mapeia filtros admin de rodada para a semantica where existente do Prisma", async () => {
    await getAdminRoundsReadModel(
      "tenant-1",
      {
        q: " Ana ",
        tableId: "table-1",
        player: "Player",
        createdBy: "Admin",
        kind: "match",
        status: "rolled_back",
        from: "2026-04-01",
        to: "2026-04-30",
      },
      { page: 2, pageSize: 25 },
    );

    const textContains = (value: string) => ({
      contains: value,
      mode: "insensitive",
    });
    const where = {
      AND: [
        { tenantId: "tenant-1" },
        {
          OR: [
            { id: textContains(" Ana ") },
            { tableId: textContains(" Ana ") },
            { rollbackOfId: textContains(" Ana ") },
            { table: { name: textContains(" Ana ") } },
            { winner: { name: textContains(" Ana ") } },
            { winner: { email: textContains(" Ana ") } },
            { loser: { name: textContains(" Ana ") } },
            { loser: { email: textContains(" Ana ") } },
            { createdBy: { name: textContains(" Ana ") } },
            { createdBy: { email: textContains(" Ana ") } },
          ],
        },
        { tableId: textContains("table-1") },
        { kind: "match" },
        { kind: "match", rollbacks: { some: {} } },
        {
          OR: [
            { winner: { name: textContains("Player") } },
            { winner: { email: textContains("Player") } },
            { loser: { name: textContains("Player") } },
            { loser: { email: textContains("Player") } },
          ],
        },
        {
          OR: [
            { createdBy: { name: textContains("Admin") } },
            { createdBy: { email: textContains("Admin") } },
          ],
        },
        {
          createdAt: {
            gte: new Date("2026-04-01T00:00:00.000"),
            lte: new Date("2026-04-30T23:59:59.999"),
          },
        },
      ],
    };

    expect(mockedConnection).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.matchHistory.count).toHaveBeenCalledWith({ where });
    expect(mockedPrisma.matchHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: 25,
        take: 25,
      }),
    );
  });

  it("mapeia filtros de status e linhas de rodada para o formato DTO admin", async () => {
    const createdAt = new Date("2026-04-30T15:45:00.000Z");
    mockedPrisma.matchHistory.count.mockResolvedValue(1);
    mockedPrisma.matchHistory.findMany.mockResolvedValue([
      {
        id: "round-1",
        tableId: "table-1",
        rollbackOfId: null,
        kind: "match",
        winnerOldElo: 1000,
        winnerNewElo: 1018,
        winnerDiffPoints: 18,
        loserOldElo: 1000,
        loserNewElo: 982,
        loserDiffPoints: -18,
        createdAt,
        table: { name: "Mesa 1" },
        winner: { name: "Winner", email: "winner@example.com" },
        loser: { name: "Loser", email: "loser@example.com" },
        createdBy: { name: "Admin", email: "admin@example.com" },
        rollbacks: [{ id: "rollback-1" }],
      },
    ] as never);

    await expect(
      getAdminRoundsReadModel(
        "tenant-1",
        {
          q: "",
          tableId: "",
          player: "",
          createdBy: "",
          kind: "all",
          status: "rollback_available",
          from: "",
          to: "",
        },
        { page: 1, pageSize: 25 },
      ),
    ).resolves.toEqual({
      pageInfo: {
        page: 1,
        pageSize: 25,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      rounds: [
        {
          id: "round-1",
          tableId: "table-1",
          rollbackOfId: null,
          rolledBack: true,
          kind: "match",
          winnerOldElo: 1000,
          winnerNewElo: 1018,
          winnerDiffPoints: 18,
          loserOldElo: 1000,
          loserNewElo: 982,
          loserDiffPoints: -18,
          createdAt: "2026-04-30T15:45:00.000Z",
          tableName: "Mesa 1",
          winner: { name: "Winner", email: "winner@example.com" },
          loser: { name: "Loser", email: "loser@example.com" },
          createdBy: { name: "Admin", email: "admin@example.com" },
        },
      ],
    });
    expect(mockedPrisma.matchHistory.count).toHaveBeenCalledWith({
      where: {
        AND: [
          { tenantId: "tenant-1" },
          { kind: "match", rollbacks: { none: {} } },
        ],
      },
    });
  });

  it("mapeia status rollback_record independentemente de kind=all", async () => {
    await getAdminRoundsReadModel(
      "tenant-1",
      {
        q: "",
        tableId: "",
        player: "",
        createdBy: "",
        kind: "all",
        status: "rollback_record",
        from: "",
        to: "",
      },
      { page: 1, pageSize: 25 },
    );

    expect(mockedPrisma.matchHistory.count).toHaveBeenCalledWith({
      where: { AND: [{ tenantId: "tenant-1" }, { kind: "rollback" }] },
    });
  });
});
