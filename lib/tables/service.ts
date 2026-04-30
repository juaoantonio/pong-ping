import { Prisma } from "@prisma/client";
import {
  calculateElo,
  calculateWinRate,
  DEFAULT_PLAYER_ELO,
  MATCH_ELO_K,
} from "@/lib/ranking/elo";
import { rotateQueueAfterMatch } from "@/lib/tables/queue";

type Tx = Prisma.TransactionClient;

async function getNextQueuePosition(tx: Tx, tableId: string) {
  const lastParticipant = await tx.pingPongTableParticipant.findFirst({
    where: { tableId },
    orderBy: { queuePosition: "desc" },
    select: { queuePosition: true },
  });

  return (lastParticipant?.queuePosition ?? -1) + 1;
}

async function reorderTableQueue(tx: Tx, participantIds: string[]) {
  const temporaryOffset = participantIds.length + 1000;

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongTableParticipant.update({
        where: { id: participantId },
        data: { queuePosition: temporaryOffset + index },
      }),
    ),
  );

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongTableParticipant.update({
        where: { id: participantId },
        data: { queuePosition: index },
      }),
    ),
  );
}

export async function ensureTableMembership(
  tx: Tx,
  tableId: string,
  userId: string,
) {
  const [table, user, existingMember] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    tx.pingPongTableMember.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!table) {
    throw new Error("table_not_found");
  }

  if (!user) {
    throw new Error("user_not_found");
  }

  if (existingMember) {
    return existingMember;
  }

  return tx.pingPongTableMember.create({
    data: {
      tableId,
      userId,
    },
  });
}

export async function enqueueUserInTable(
  tx: Tx,
  tableId: string,
  userId: string,
) {
  const [table, membership, existingParticipant] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongTableMember.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
    tx.pingPongTableParticipant.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!table) {
    throw new Error("table_not_found");
  }

  if (!membership) {
    throw new Error("user_not_in_table");
  }

  if (existingParticipant) {
    throw new Error("user_already_queued");
  }

  return tx.pingPongTableParticipant.create({
    data: {
      tableId,
      userId,
      queuePosition: await getNextQueuePosition(tx, tableId),
    },
  });
}

export async function removeParticipantFromTable(
  tx: Tx,
  tableId: string,
  participantId: string,
) {
  const participants = await tx.pingPongTableParticipant.findMany({
    where: { tableId },
    orderBy: { queuePosition: "asc" },
    select: { id: true },
  });

  const nextQueue = participants.filter(
    (participant) => participant.id !== participantId,
  );

  if (nextQueue.length === participants.length) {
    throw new Error("participant_not_found");
  }

  await tx.pingPongTableParticipant.delete({
    where: { id: participantId },
  });

  await reorderTableQueue(
    tx,
    nextQueue.map((participant) => participant.id),
  );
}

export async function removeUserFromTableQueue(
  tx: Tx,
  tableId: string,
  userId: string,
) {
  const [table, participant, queueCount] = await Promise.all([
    tx.pingPongTable.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongTableParticipant.findUnique({
      where: {
        tableId_userId: { tableId, userId },
      },
      select: { id: true, queuePosition: true },
    }),
    tx.pingPongTableParticipant.count({
      where: { tableId },
    }),
  ]);

  if (!table) {
    throw new Error("table_not_found");
  }

  if (!participant) {
    throw new Error("user_not_queued");
  }

  if (participant.queuePosition < 2 && queueCount >= 2) {
    throw new Error("current_player_cannot_leave_queue");
  }

  await removeParticipantFromTable(tx, tableId, participant.id);

  return participant;
}

export async function finishTableMatch(
  tx: Tx,
  tableId: string,
  winnerParticipantId: string,
  actorUserId: string,
) {
  const table = await tx.pingPongTable.findUnique({
    where: { id: tableId },
    select: { id: true },
  });

  if (!table) {
    throw new Error("table_not_found");
  }

  const queue = await tx.pingPongTableParticipant.findMany({
    where: { tableId },
    orderBy: { queuePosition: "asc" },
    select: { id: true, userId: true, queuePosition: true },
  });

  if (queue.length < 2) {
    throw new Error("not_enough_players");
  }

  const reorderedQueueIds = rotateQueueAfterMatch(
    queue.map((participant) => participant.id),
    winnerParticipantId,
  );

  const currentPlayers = queue.slice(0, 2);
  const winnerParticipant = currentPlayers.find(
    (participant) => participant.id === winnerParticipantId,
  );
  const loserParticipant = currentPlayers.find(
    (participant) => participant.id !== winnerParticipantId,
  );

  if (!winnerParticipant || !loserParticipant) {
    throw new Error("winner_not_in_current_match");
  }

  const [winnerRanking, loserRanking] = await Promise.all([
    tx.playerRanking.upsert({
      where: { userId: winnerParticipant.userId },
      update: {},
      create: { userId: winnerParticipant.userId, elo: DEFAULT_PLAYER_ELO },
    }),
    tx.playerRanking.upsert({
      where: { userId: loserParticipant.userId },
      update: {},
      create: { userId: loserParticipant.userId, elo: DEFAULT_PLAYER_ELO },
    }),
  ]);

  const nextElo = calculateElo(
    winnerRanking.elo,
    loserRanking.elo,
    MATCH_ELO_K,
  );
  const winnerWins = winnerRanking.wins + 1;
  const winnerTotalMatches = winnerRanking.total_matches + 1;
  const loserTotalMatches = loserRanking.total_matches + 1;

  const winnerDiffPoints = nextElo.winnerElo - winnerRanking.elo;
  const loserDiffPoints = nextElo.loserElo - loserRanking.elo;

  const [createdMatch] = await Promise.all([
    tx.matchHistory.create({
      data: {
        tableId,
        winnerId: winnerParticipant.userId,
        loserId: loserParticipant.userId,
        kind: "match",
        createdById: actorUserId,
        kFactor: MATCH_ELO_K,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextElo.winnerElo,
        winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextElo.loserElo,
        loserDiffPoints,
      },
      select: {
        id: true,
        winnerId: true,
        loserId: true,
        winnerNewElo: true,
        loserNewElo: true,
      },
    }),
    tx.playerRanking.update({
      where: { userId: winnerParticipant.userId },
      data: {
        elo: nextElo.winnerElo,
        wins: winnerWins,
        total_matches: winnerTotalMatches,
        winRate: calculateWinRate(winnerWins, winnerTotalMatches),
      },
    }),
    tx.playerRanking.update({
      where: { userId: loserParticipant.userId },
      data: {
        elo: nextElo.loserElo,
        total_matches: loserTotalMatches,
        winRate: calculateWinRate(loserRanking.wins, loserTotalMatches),
      },
    }),
    tx.auditLog.create({
      data: {
        actorUserId,
        action: "table_match_finished",
        metadata: {
          tableId,
          winnerId: winnerParticipant.userId,
          loserId: loserParticipant.userId,
          kFactor: MATCH_ELO_K,
        },
      },
    }),
  ]);

  await reorderTableQueue(tx, reorderedQueueIds);

  return createdMatch;
}

export async function rollbackTableMatch(
  tx: Tx,
  tableId: string,
  matchHistoryId: string,
  actorUserId: string,
) {
  const match = await tx.matchHistory.findFirst({
    where: { id: matchHistoryId, tableId },
    select: {
      id: true,
      tableId: true,
      winnerId: true,
      loserId: true,
      kind: true,
      kFactor: true,
      winnerDiffPoints: true,
      loserDiffPoints: true,
      rollbacks: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!match) {
    throw new Error("match_not_found");
  }

  if (match.kind === "rollback") {
    throw new Error("cannot_rollback_rollback");
  }

  if (match.rollbacks.length > 0) {
    throw new Error("match_already_rolled_back");
  }

  const [winnerRanking, loserRanking] = await Promise.all([
    tx.playerRanking.findUnique({
      where: { userId: match.winnerId },
    }),
    tx.playerRanking.findUnique({
      where: { userId: match.loserId },
    }),
  ]);

  if (!winnerRanking || !loserRanking) {
    throw new Error("ranking_not_found");
  }

  const nextWinnerElo = winnerRanking.elo - match.winnerDiffPoints;
  const nextLoserElo = loserRanking.elo - match.loserDiffPoints;
  const nextWinnerWins = Math.max(0, winnerRanking.wins - 1);
  const nextWinnerTotalMatches = Math.max(0, winnerRanking.total_matches - 1);
  const nextLoserTotalMatches = Math.max(0, loserRanking.total_matches - 1);

  const [rollback] = await Promise.all([
    tx.matchHistory.create({
      data: {
        tableId,
        winnerId: match.winnerId,
        loserId: match.loserId,
        kind: "rollback",
        rollbackOfId: match.id,
        createdById: actorUserId,
        kFactor: match.kFactor,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextWinnerElo,
        winnerDiffPoints: -match.winnerDiffPoints,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextLoserElo,
        loserDiffPoints: -match.loserDiffPoints,
      },
      select: {
        id: true,
        rollbackOfId: true,
        winnerId: true,
        loserId: true,
        winnerNewElo: true,
        loserNewElo: true,
      },
    }),
    tx.playerRanking.update({
      where: { userId: match.winnerId },
      data: {
        elo: nextWinnerElo,
        wins: nextWinnerWins,
        total_matches: nextWinnerTotalMatches,
        winRate: calculateWinRate(nextWinnerWins, nextWinnerTotalMatches),
      },
    }),
    tx.playerRanking.update({
      where: { userId: match.loserId },
      data: {
        elo: nextLoserElo,
        total_matches: nextLoserTotalMatches,
        winRate: calculateWinRate(loserRanking.wins, nextLoserTotalMatches),
      },
    }),
    tx.auditLog.create({
      data: {
        actorUserId,
        action: "table_match_rolled_back",
        metadata: {
          tableId,
          matchHistoryId,
          winnerId: match.winnerId,
          loserId: match.loserId,
        },
      },
    }),
  ]);

  return rollback;
}
