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

describe("consultas de mesa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("limita listas de mesas e dados aninhados ao tenant do ator", async () => {
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

  it("retorna null para buscas de detalhe de mesa entre tenants", async () => {
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

  it("limita opcoes de usuarios da mesa ao tenant do ator", async () => {
    mockedPrisma.user.findMany.mockResolvedValue([]);

    await expect(getTableUserOptions("tenant-1")).resolves.toEqual([]);

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: "tenant-1" },
      }),
    );
  });

  it("limita busca de mesa do scoreboard e associacao ao tenant do ator", async () => {
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
