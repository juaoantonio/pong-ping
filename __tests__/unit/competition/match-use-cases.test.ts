/**
 * @jest-environment node
 */

import { finishMatch, rollbackMatch } from "@/lib/contexts/competition";

function ranking(userId: string, elo = 1000) {
  return {
    id: `ranking-${userId}`,
    userId,
    elo,
    wins: 0,
    total_matches: 0,
    winRate: 0,
    createdAt: new Date("2026-05-04T12:00:00.000Z"),
    updatedAt: new Date("2026-05-04T12:00:00.000Z"),
  };
}

function createFinishTx() {
  const tx = {
    pingPongTable: {
      findUnique: jest.fn(),
    },
    pingPongTableParticipant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    playerRanking: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
    matchHistory: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  tx.pingPongTable.findUnique.mockResolvedValue({ id: "table-1" });
  tx.pingPongTableParticipant.findMany.mockResolvedValue([
    { id: "participant-winner", userId: "winner-1", queuePosition: 0 },
    { id: "participant-loser", userId: "loser-1", queuePosition: 1 },
    { id: "participant-next", userId: "next-1", queuePosition: 2 },
  ]);
  tx.pingPongTableParticipant.update.mockResolvedValue({});
  tx.playerRanking.upsert
    .mockResolvedValueOnce(ranking("winner-1"))
    .mockResolvedValueOnce(ranking("loser-1"));
  tx.playerRanking.update.mockResolvedValue({});
  tx.matchHistory.create.mockResolvedValue({
    id: "match-1",
    winnerId: "winner-1",
    loserId: "loser-1",
    winnerNewElo: 1032,
    loserNewElo: 968,
  });
  tx.auditLog.create.mockResolvedValue({});

  return tx;
}

describe("competition match use cases", () => {
  it("finishes a match with equivalent Elo, match history, audit, and queue rotation", async () => {
    const tx = createFinishTx();

    await expect(
      finishMatch(tx as never, {
        tableId: "table-1",
        winnerParticipantId: "participant-winner",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        id: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1032,
        loserNewElo: 968,
      },
    });

    expect(tx.matchHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tableId: "table-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        kind: "match",
        createdById: "admin-1",
        kFactor: 64,
        winnerOldElo: 1000,
        winnerNewElo: 1032,
        winnerDiffPoints: 32,
        loserOldElo: 1000,
        loserNewElo: 968,
        loserDiffPoints: -32,
      }),
      select: expect.any(Object),
    });
    expect(tx.playerRanking.update).toHaveBeenCalledWith({
      where: { userId: "winner-1" },
      data: {
        elo: 1032,
        wins: 1,
        total_matches: 1,
        winRate: 100,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        targetUserId: undefined,
        action: "table_match_finished",
        metadata: {
          tableId: "table-1",
          winnerId: "winner-1",
          loserId: "loser-1",
          kFactor: 64,
        },
      },
    });
    expect(tx.pingPongTableParticipant.update).toHaveBeenCalledWith({
      where: { id: "participant-winner" },
      data: { queuePosition: 1003 },
    });
    expect(tx.pingPongTableParticipant.update).toHaveBeenCalledWith({
      where: { id: "participant-loser" },
      data: { queuePosition: 2 },
    });
  });

  it("rejects matches with fewer than two current players", async () => {
    const tx = createFinishTx();
    tx.pingPongTableParticipant.findMany.mockResolvedValueOnce([
      { id: "participant-1", userId: "user-1", queuePosition: 0 },
    ]);

    await expect(
      finishMatch(tx as never, {
        tableId: "table-1",
        winnerParticipantId: "participant-1",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "competition",
        code: "not_enough_players",
      },
    });

    expect(tx.matchHistory.create).not.toHaveBeenCalled();
  });

  it("rejects winners outside the current match", async () => {
    const tx = createFinishTx();

    await expect(
      finishMatch(tx as never, {
        tableId: "table-1",
        winnerParticipantId: "participant-next",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "competition",
        code: "winner_not_in_current_match",
      },
    });
  });
});

describe("competition rollback use cases", () => {
  function createRollbackTx() {
    const tx = {
      matchHistory: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      playerRanking: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    tx.matchHistory.findFirst.mockResolvedValue({
      id: "match-1",
      tableId: "table-1",
      winnerId: "winner-1",
      loserId: "loser-1",
      kind: "match",
      kFactor: 64,
      winnerDiffPoints: 32,
      loserDiffPoints: -32,
      rollbacks: [],
    });
    tx.playerRanking.findUnique
      .mockResolvedValueOnce({
        ...ranking("winner-1", 1032),
        wins: 1,
        total_matches: 1,
        winRate: 100,
      })
      .mockResolvedValueOnce({
        ...ranking("loser-1", 968),
        wins: 0,
        total_matches: 1,
        winRate: 0,
      });
    tx.playerRanking.update.mockResolvedValue({});
    tx.matchHistory.create.mockResolvedValue({
      id: "rollback-1",
      rollbackOfId: "match-1",
      winnerId: "winner-1",
      loserId: "loser-1",
      winnerNewElo: 1000,
      loserNewElo: 1000,
    });
    tx.auditLog.create.mockResolvedValue({});

    return tx;
  }

  it("rolls back ranking and records rollback history and audit", async () => {
    const tx = createRollbackTx();

    await expect(
      rollbackMatch(tx as never, {
        tableId: "table-1",
        matchHistoryId: "match-1",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: true,
      value: {
        id: "rollback-1",
        rollbackOfId: "match-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        winnerNewElo: 1000,
        loserNewElo: 1000,
      },
    });

    expect(tx.matchHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tableId: "table-1",
        winnerId: "winner-1",
        loserId: "loser-1",
        kind: "rollback",
        rollbackOfId: "match-1",
        winnerOldElo: 1032,
        winnerNewElo: 1000,
        winnerDiffPoints: -32,
        loserOldElo: 968,
        loserNewElo: 1000,
        loserDiffPoints: 32,
      }),
      select: expect.any(Object),
    });
    expect(tx.playerRanking.update).toHaveBeenCalledWith({
      where: { userId: "winner-1" },
      data: {
        elo: 1000,
        wins: 0,
        total_matches: 0,
        winRate: 0,
      },
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        targetUserId: undefined,
        action: "table_match_rolled_back",
        metadata: {
          tableId: "table-1",
          matchHistoryId: "match-1",
          winnerId: "winner-1",
          loserId: "loser-1",
        },
      },
    });
  });

  it("rejects rollback records and already rolled back matches", async () => {
    const tx = createRollbackTx();
    tx.matchHistory.findFirst.mockResolvedValueOnce({
      id: "rollback-1",
      kind: "rollback",
      rollbacks: [],
    });

    await expect(
      rollbackMatch(tx as never, {
        tableId: "table-1",
        matchHistoryId: "rollback-1",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "competition",
        code: "cannot_rollback_rollback",
      },
    });

    tx.matchHistory.findFirst.mockResolvedValueOnce({
      id: "match-1",
      kind: "match",
      rollbacks: [{ id: "rollback-1" }],
    });

    await expect(
      rollbackMatch(tx as never, {
        tableId: "table-1",
        matchHistoryId: "match-1",
        actorUserId: "admin-1",
      }),
    ).resolves.toEqual({
      ok: false,
      error: {
        context: "competition",
        code: "match_already_rolled_back",
      },
    });
  });
});
