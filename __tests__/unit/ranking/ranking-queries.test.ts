/**
 * @jest-environment node
 */

import { connection } from "next/server";
import { getPublicRankings } from "@/lib/rankings/queries";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    rankLevel: {
      findMany: jest.fn(),
    },
  },
}));

const mockedConnection = jest.mocked(connection);
const mockedPrisma = jest.mocked(prisma);

describe("ranking queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnection.mockResolvedValue(undefined);
    mockedPrisma.user.count.mockResolvedValue(1);
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: "user-1",
        name: "Player",
        email: "player@example.com",
        playerRanking: {
          elo: 1100,
          wins: 3,
          total_matches: 4,
          winRate: 75,
        },
      },
    ]);
    mockedPrisma.rankLevel.findMany.mockResolvedValue([
      { name: "Bronze", minElo: 1000, iconImgKey: "missing.png" },
    ]);
  });

  it("scopes public ranking reads to the requested tenant", async () => {
    await expect(
      getPublicRankings({ page: 1, pageSize: 25 }, "tenant-1"),
    ).resolves.toMatchObject({
      pageInfo: {
        totalCount: 1,
      },
      rankings: [
        {
          id: "user-1",
          ranking: {
            elo: 1100,
            wins: 3,
            total_matches: 4,
            winRate: 75,
          },
          rankLevel: { name: "Bronze" },
        },
      ],
    });

    expect(mockedPrisma.user.count).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1" },
    });
    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1" },
      }),
    );
  });
});
