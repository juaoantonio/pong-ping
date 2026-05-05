/**
 * @jest-environment node
 */

import {
  getTableDetail,
  getTableListItems,
  getTableScoreboard,
  getTableUserOptions,
} from "@/lib/tables/queries";
import { prisma } from "@/lib/prisma";

jest.mock("next/server", () => ({
  connection: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    pingPongTable: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = jest.mocked(prisma);

describe("table queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scopes table lists and nested table data to the actor tenant", async () => {
    mockedPrisma.pingPongTable.count.mockResolvedValue(0);
    mockedPrisma.pingPongTable.findMany.mockResolvedValue([]);

    await expect(
      getTableListItems({ page: 1, pageSize: 10 }, "tenant-1"),
    ).resolves.toMatchObject({ tables: [] });

    expect(mockedPrisma.pingPongTable.count).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1", deletedAt: null },
    });
    expect(mockedPrisma.pingPongTable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1", deletedAt: null },
        select: expect.objectContaining({
          participants: expect.objectContaining({
            where: { tenantId: "tenant-1" },
          }),
          matchHistories: expect.objectContaining({
            where: { tenantId: "tenant-1" },
          }),
        }),
      }),
    );
  });

  it("returns null for cross-tenant table detail lookups", async () => {
    mockedPrisma.pingPongTable.findFirst.mockResolvedValue(null);

    await expect(
      getTableDetail("table-a", "user-b", "tenant-b"),
    ).resolves.toBeNull();

    expect(mockedPrisma.pingPongTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "table-a", tenantId: "tenant-b", deletedAt: null },
      }),
    );
  });

  it("scopes table user options to the actor tenant", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([]);

    await expect(getTableUserOptions("tenant-1")).resolves.toEqual([]);

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1" },
      }),
    );
  });

  it("scopes scoreboard table and membership lookup to the actor tenant", async () => {
    mockedPrisma.pingPongTable.findFirst.mockResolvedValue(null);

    await expect(
      getTableScoreboard("table-a", "user-b", "tenant-b"),
    ).resolves.toBeNull();

    expect(mockedPrisma.pingPongTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "table-a", tenantId: "tenant-b", deletedAt: null },
        select: expect.objectContaining({
          participants: expect.objectContaining({
            where: { tenantId: "tenant-b" },
          }),
          members: expect.objectContaining({
            where: { userId: "user-b", tenantId: "tenant-b" },
          }),
        }),
      }),
    );
  });
});
