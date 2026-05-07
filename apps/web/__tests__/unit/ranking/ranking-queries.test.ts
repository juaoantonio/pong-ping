/**
 * @jest-environment node
 */

import { connection } from "next/server";
import type { Prisma } from "@prisma/client";
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

type PublicRankingUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    image: true;
    avatarUrl: true;
    playerRanking: {
      select: {
        elo: true;
        wins: true;
        total_matches: true;
        winRate: true;
      };
    };
  };
}>;

type PublicRankLevel = Prisma.RankLevelGetPayload<{
  select: {
    name: true;
    minElo: true;
    iconImgKey: true;
  };
}>;

describe("consultas de ranking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnection.mockResolvedValue(undefined);
    mockedPrisma.user.count.mockResolvedValue(1);
    const publicRankingUsers = [
      {
        id: "user-1",
        name: "Player",
        email: "player@example.com",
        image: "https://example.com/google-avatar.png",
        avatarUrl: null,
        playerRanking: {
          elo: 1100,
          wins: 3,
          total_matches: 4,
          winRate: 75,
        },
      },
    ] satisfies PublicRankingUser[];
    const publicRankLevels = [
      { name: "Bronze", minElo: 1000, iconImgKey: "missing.png" },
    ] satisfies PublicRankLevel[];

    mockedPrisma.user.findMany.mockResolvedValue(publicRankingUsers as never);
    mockedPrisma.rankLevel.findMany.mockResolvedValue(
      publicRankLevels as never,
    );
  });

  it("limita leituras publicas de ranking ao tenant solicitado", async () => {
    await expect(
      getPublicRankings({ page: 1, pageSize: 25 }, "tenant-1"),
    ).resolves.toMatchObject({
      pageInfo: {
        totalCount: 1,
      },
      rankings: [
        {
          id: "user-1",
          avatarUrl: "https://example.com/google-avatar.png",
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
        select: expect.objectContaining({
          avatarUrl: true,
          image: true,
        }),
      }),
    );
  });
});
