import {
  enqueueUserInTable,
  removeUserFromCurrentRound,
  removeUserFromTableQueue,
  rotateQueueAfterMatch,
} from "@/lib/contexts/table-play";

describe("table queue", () => {
  it("keeps the winner on the table and sends the loser to the back", () => {
    expect(rotateQueueAfterMatch(["a", "b", "c", "d"], "a")).toEqual([
      "a",
      "c",
      "d",
      "b",
    ]);
    expect(rotateQueueAfterMatch(["a", "b", "c", "d"], "b")).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
  });

  it("rejects invalid winners", () => {
    expect(() => rotateQueueAfterMatch(["a", "b"], "c")).toThrow(
      "winner_not_in_current_match",
    );
  });

  it("queues table members at the next position with a domain result", async () => {
    const participant = {
      id: "participant-1",
      tableId: "table-1",
      userId: "user-1",
      queuePosition: 3,
      joinedAt: new Date("2026-04-30T12:00:00.000Z"),
    };
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "user-1" }),
      },
      pingPongTableMember: {
        findFirst: jest.fn().mockResolvedValue({ id: "member-1" }),
        create: jest.fn(),
      },
      pingPongTableParticipant: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ queuePosition: 2 }),
        create: jest.fn().mockResolvedValue(participant),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: true,
      value: { participant, membershipCreated: false },
    });
    expect(tx.pingPongTableMember.create).not.toHaveBeenCalled();
    expect(tx.pingPongTableParticipant.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        tableId: "table-1",
        userId: "user-1",
        queuePosition: 3,
      },
    });
    expect(tx.pingPongTable.findFirst).toHaveBeenCalledWith({
      where: { id: "table-1", tenantId: "tenant-1", deletedAt: null },
      select: { id: true },
    });
  });

  it("creates table membership when a same-tenant non-member queues", async () => {
    const participant = {
      id: "participant-1",
      tableId: "table-1",
      userId: "user-1",
      queuePosition: 0,
      joinedAt: new Date("2026-04-30T12:00:00.000Z"),
    };
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "user-1" }),
      },
      pingPongTableMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "member-1" }),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(participant),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: true,
      value: { participant, membershipCreated: true },
    });
    expect(tx.pingPongTableMember.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        tableId: "table-1",
        userId: "user-1",
      },
      select: { id: true },
    });
    expect(tx.pingPongTableParticipant.create).toHaveBeenCalledWith({
      data: {
        tenantId: "tenant-1",
        tableId: "table-1",
        userId: "user-1",
        queuePosition: 0,
      },
    });
  });

  it("keeps duplicate queue joins from creating membership or participant rows", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "user-1" }),
      },
      pingPongTableMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue({ id: "participant-1" }),
        create: jest.fn(),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "table-play",
        code: "user_already_queued",
        message: "Voce ja esta na fila desta mesa.",
      },
    });
    expect(tx.pingPongTableMember.create).not.toHaveBeenCalled();
    expect(tx.pingPongTableParticipant.create).not.toHaveBeenCalled();
  });

  it("denies queue joins through tenant-scoped table lookup", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: "user-1" }),
      },
      pingPongTableMember: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "table-play",
        code: "table_not_found",
        message: "Mesa nao encontrada.",
      },
    });
    expect(tx.pingPongTable.findFirst).toHaveBeenCalledWith({
      where: { id: "table-1", tenantId: "tenant-1", deletedAt: null },
      select: { id: true },
    });
    expect(tx.pingPongTableMember.create).not.toHaveBeenCalled();
    expect(tx.pingPongTableParticipant.create).not.toHaveBeenCalled();
  });

  it("keeps current players from leaving while a match can be played", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: "participant-1",
          queuePosition: 1,
        }),
        count: jest.fn().mockResolvedValue(2),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    await expect(
      removeUserFromTableQueue(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "table-play",
        code: "current_player_cannot_leave_queue",
        message: "Jogadores da rodada atual nao podem sair da fila.",
      },
    });
    expect(tx.pingPongTableParticipant.delete).not.toHaveBeenCalled();
  });

  it("lets current players leave the active round without recording a match", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: "participant-1",
          queuePosition: 0,
        }),
        count: jest.fn().mockResolvedValue(3),
        findMany: jest.fn().mockResolvedValue([
          { id: "participant-1" },
          { id: "participant-2" },
          { id: "participant-3" },
        ]),
        delete: jest.fn().mockResolvedValue({ id: "participant-1" }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    await expect(
      removeUserFromCurrentRound(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: true,
      value: {
        id: "participant-1",
        queuePosition: 0,
      },
    });
    expect(tx.pingPongTableParticipant.delete).toHaveBeenCalledWith({
      where: { id: "participant-1" },
    });
    expect(tx.pingPongTableParticipant.update).toHaveBeenCalledWith({
      where: { id: "participant-2" },
      data: { queuePosition: 1002 },
    });
    expect(tx.pingPongTableParticipant.update).toHaveBeenCalledWith({
      where: { id: "participant-2" },
      data: { queuePosition: 0 },
    });
  });

  it("rejects non-current players leaving the active round", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      pingPongTableParticipant: {
        findFirst: jest.fn().mockResolvedValue({
          id: "participant-3",
          queuePosition: 2,
        }),
        count: jest.fn().mockResolvedValue(3),
        delete: jest.fn(),
      },
    };

    await expect(
      removeUserFromCurrentRound(tx as never, "table-1", "user-1", "tenant-1"),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "table-play",
        code: "user_not_in_current_match",
        message: "Voce nao esta na rodada atual.",
      },
    });
    expect(tx.pingPongTableParticipant.delete).not.toHaveBeenCalled();
  });
});
