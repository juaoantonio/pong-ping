/**
 * @jest-environment node
 */

import { DELETE, POST } from "@/app/api/rooms/[roomId]/queue/route";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  enqueueUserInRoom,
  removeUserFromRoomQueue,
} from "@/lib/rooms/service";

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}));

jest.mock("@/lib/rooms/service", () => ({
  enqueueUserInRoom: jest.fn(),
  removeUserFromRoomQueue: jest.fn(),
}));

const mockedGetCurrentUser = jest.mocked(getCurrentUser);
const mockedTransaction = jest.mocked(prisma.$transaction);
const mockedEnqueueUserInRoom = jest.mocked(enqueueUserInRoom);
const mockedRemoveUserFromRoomQueue = jest.mocked(removeUserFromRoomQueue);

function routeContext(roomId = "room-1") {
  return {
    params: Promise.resolve({ roomId }),
  };
}

describe("room queue route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects unauthenticated users", async () => {
    mockedGetCurrentUser.mockResolvedValue(null);

    const response = await POST(new Request("http://test.local"), routeContext());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Nao autenticado." });
  });

  it("rejects users who are not room members", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedEnqueueUserInRoom.mockRejectedValue(new Error("user_not_in_room"));

    const response = await POST(new Request("http://test.local"), routeContext());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Entre na sala antes de entrar na fila.",
    });
  });

  it("rejects users who are already queued", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
      createdAt: new Date("2026-04-30T12:00:00.000Z"),
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedEnqueueUserInRoom.mockRejectedValue(new Error("user_already_queued"));

    const response = await POST(new Request("http://test.local"), routeContext());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Voce ja esta na fila desta sala.",
    });
  });

  it("queues room members and writes an audit log", async () => {
    const auditCreate = jest.fn();
    const participant = {
      id: "participant-1",
      roomId: "room-1",
      userId: "user-1",
      queuePosition: 0,
      joinedAt: new Date("2026-04-30T12:00:00.000Z"),
    };

    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: auditCreate },
      } as never),
    );
    mockedEnqueueUserInRoom.mockResolvedValue(participant);

    const response = await POST(new Request("http://test.local"), routeContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      participant: {
        ...participant,
        joinedAt: "2026-04-30T12:00:00.000Z",
      },
    });
    expect(mockedEnqueueUserInRoom).toHaveBeenCalledWith(
      expect.anything(),
      "room-1",
      "user-1",
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: "user-1",
        action: "room_queue_joined",
        metadata: { roomId: "room-1" },
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
    await expect(response.json()).resolves.toEqual({ error: "Nao autenticado." });
  });

  it("rejects users who are not queued", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedRemoveUserFromRoomQueue.mockRejectedValue(new Error("user_not_queued"));

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Voce nao esta na fila desta sala.",
    });
  });

  it("rejects current players leaving the queue", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: jest.fn() },
      } as never),
    );
    mockedRemoveUserFromRoomQueue.mockRejectedValue(
      new Error("current_player_cannot_leave_queue"),
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

    mockedGetCurrentUser.mockResolvedValue({
      id: "user-1",
      role: "user",
      email: "user@example.com",
      name: "User",
      avatarUrl: null,
      image: null,
    });
    mockedTransaction.mockImplementation(async (callback) =>
      callback({
        auditLog: { create: auditCreate },
      } as never),
    );
    mockedRemoveUserFromRoomQueue.mockResolvedValue({
      id: "participant-1",
      queuePosition: 2,
    });

    const response = await DELETE(
      new Request("http://test.local"),
      routeContext(),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mockedRemoveUserFromRoomQueue).toHaveBeenCalledWith(
      expect.anything(),
      "room-1",
      "user-1",
    );
    expect(auditCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "user-1",
        targetUserId: "user-1",
        action: "room_queue_left",
        metadata: { roomId: "room-1", participantId: "participant-1" },
      },
    });
  });
});
