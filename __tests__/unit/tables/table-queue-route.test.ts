/**
 * @jest-environment node
 */

import { DELETE, POST } from "@/app/api/tables/[tableId]/queue/route";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  enqueueUserInTable,
  removeUserFromTableQueue,
} from "@/lib/contexts/table-play";

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/contexts/table-play", () => ({
  enqueueUserInTable: jest.fn(),
  removeUserFromTableQueue: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedTransaction = jest.mocked(prisma.$transaction);
const mockedEnqueueUserInTable = jest.mocked(enqueueUserInTable);
const mockedRemoveUserFromTableQueue = jest.mocked(removeUserFromTableQueue);

function routeContext(tableId = "table-1") {
  return {
    params: Promise.resolve({ tableId }),
  };
}

function tablePlayError(code: string) {
  return {
    ok: false as const,
    error: {
      context: "table-play",
      code,
    },
  };
}

function authenticatedUser() {
  return {
    id: "user-1",
    tenantId: "tenant-1",
    role: "user" as const,
    email: "user@example.com",
    name: "User",
    avatarUrl: null,
    image: null,
    createdAt: new Date("2026-04-30T12:00:00.000Z"),
  };
}

describe("table queue route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Nao autenticado.",
    });
  });

  it("queues same-tenant users directly when membership is auto-created", async () => {
    const auditCreate = jest.fn();
    const participant = {
      id: "participant-1",
      tableId: "table-1",
      userId: "user-1",
      queuePosition: 0,
      joinedAt: new Date("2026-04-30T12:00:00.000Z"),
    };

    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: auditCreate },
      } as never),
    );
    mockedEnqueueUserInTable.mockResolvedValue({
      ok: true,
      value: {
        participant,
        membershipCreated: true,
      },
    });

    const response = await POST(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      participant: {
        ...participant,
        joinedAt: "2026-04-30T12:00:00.000Z",
      },
    });
    expect(mockedEnqueueUserInTable).toHaveBeenCalledWith(
      expect.anything(),
      "table-1",
      "user-1",
      "tenant-1",
    );
    expect(mockedTransaction).toHaveBeenCalledTimes(1);
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: "user-1",
        action: "table_queue_joined",
        metadata: {
          tableId: "table-1",
          membershipAutoCreated: true,
        },
      },
    });
  });

  it("rejects users who are already queued", async () => {
    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedEnqueueUserInTable.mockResolvedValue(
      tablePlayError("user_already_queued") as never,
    );

    const response = await POST(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Voce ja esta na fila desta mesa.",
    });
  });

  it("queues table members and writes an audit log", async () => {
    const auditCreate = jest.fn();
    const participant = {
      id: "participant-1",
      tableId: "table-1",
      userId: "user-1",
      queuePosition: 0,
      joinedAt: new Date("2026-04-30T12:00:00.000Z"),
    };

    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: auditCreate },
      } as never),
    );
    mockedEnqueueUserInTable.mockResolvedValue({
      ok: true,
      value: {
        participant,
        membershipCreated: false,
      },
    });

    const response = await POST(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      participant: {
        ...participant,
        joinedAt: "2026-04-30T12:00:00.000Z",
      },
    });
    expect(mockedEnqueueUserInTable).toHaveBeenCalledWith(
      expect.anything(),
      "table-1",
      "user-1",
      "tenant-1",
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: "user-1",
        action: "table_queue_joined",
        metadata: {
          tableId: "table-1",
          membershipAutoCreated: false,
        },
      },
    });
  });

  it("rejects unauthenticated users leaving the queue", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Nao autenticado.",
    });
  });

  it("rejects users who are not queued", async () => {
    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedRemoveUserFromTableQueue.mockResolvedValue(
      tablePlayError("user_not_queued") as never,
    );

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Voce nao esta na fila desta mesa.",
    });
  });

  it("rejects current players leaving the queue", async () => {
    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedRemoveUserFromTableQueue.mockResolvedValue(
      tablePlayError("current_player_cannot_leave_queue") as never,
    );

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Jogadores da rodada atual nao podem sair da fila.",
    });
  });

  it("removes queued users and writes an audit log", async () => {
    const auditCreate = jest.fn();

    mockedGetCurrentUser.mockResolvedValue(authenticatedUser());
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: auditCreate },
      } as never),
    );
    mockedRemoveUserFromTableQueue.mockResolvedValue({
      ok: true,
      value: {
        id: "participant-1",
        queuePosition: 2,
      },
    });

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockedRemoveUserFromTableQueue).toHaveBeenCalledWith(
      expect.anything(),
      "table-1",
      "user-1",
      "tenant-1",
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: "user-1",
        action: "table_queue_left",
        metadata: { tableId: "table-1", participantId: "participant-1" },
      },
    });
  });
});
