import {
  enqueueUserInTable,
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
      pingPongTableMember: {
        findUnique: jest.fn().mockResolvedValue({ id: "member-1" }),
      },
      pingPongTableParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ queuePosition: 2 }),
        create: jest.fn().mockResolvedValue(participant),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1"),
    ).resolves.toEqual({
      ok: true,
      value: participant,
    });
    expect(tx.pingPongTableParticipant.create).toHaveBeenCalledWith({
      data: {
        tableId: "table-1",
        userId: "user-1",
        queuePosition: 3,
      },
    });
  });

  it("returns a domain error when a non-member tries to queue", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      pingPongTableMember: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      pingPongTableParticipant: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    await expect(
      enqueueUserInTable(tx as never, "table-1", "user-1"),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "table-play",
        code: "user_not_in_table",
        message: "Entre na mesa antes de entrar na fila.",
      },
    });
  });

  it("keeps current players from leaving while a match can be played", async () => {
    const tx = {
      pingPongTable: {
        findFirst: jest.fn().mockResolvedValue({ id: "table-1" }),
      },
      pingPongTableParticipant: {
        findUnique: jest.fn().mockResolvedValue({
          id: "participant-1",
          queuePosition: 1,
        }),
        count: jest.fn().mockResolvedValue(2),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
    };

    await expect(
      removeUserFromTableQueue(tx as never, "table-1", "user-1"),
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
});
