import { Prisma } from "@prisma/client";
import {
  calculateElo,
  calculateWinRate,
  DEFAULT_PLAYER_ELO,
  MATCH_ELO_K,
} from "@/lib/ranking/elo";
import { rotateQueueAfterMatch } from "@/lib/rooms/queue";

type Tx = Prisma.TransactionClient;

async function getNextQueuePosition(tx: Tx, roomId: string) {
  const lastParticipant = await tx.pingPongRoomParticipant.findFirst({
    where: { roomId },
    orderBy: { queuePosition: "desc" },
    select: { queuePosition: true },
  });

  return (lastParticipant?.queuePosition ?? -1) + 1;
}

async function reorderRoomQueue(tx: Tx, participantIds: string[]) {
  const temporaryOffset = participantIds.length + 1000;

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongRoomParticipant.update({
        where: { id: participantId },
        data: { queuePosition: temporaryOffset + index },
      }),
    ),
  );

  await Promise.all(
    participantIds.map((participantId, index) =>
      tx.pingPongRoomParticipant.update({
        where: { id: participantId },
        data: { queuePosition: index },
      }),
    ),
  );
}

export async function ensureRoomMembership(
  tx: Tx,
  roomId: string,
  userId: string,
) {
  const [room, user, existingMember] = await Promise.all([
    tx.pingPongRoom.findFirst({
      where: { id: roomId, deletedAt: null },
      select: { id: true },
    }),
    tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    tx.pingPongRoomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!room) {
    throw new Error("room_not_found");
  }

  if (!user) {
    throw new Error("user_not_found");
  }

  if (existingMember) {
    return existingMember;
  }

  return tx.pingPongRoomMember.create({
    data: {
      roomId,
      userId,
    },
  });
}

export async function enqueueUserInRoom(
  tx: Tx,
  roomId: string,
  userId: string,
) {
  const [room, membership, existingParticipant] = await Promise.all([
    tx.pingPongRoom.findFirst({
      where: { id: roomId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongRoomMember.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
      select: { id: true },
    }),
    tx.pingPongRoomParticipant.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
      select: { id: true },
    }),
  ]);

  if (!room) {
    throw new Error("room_not_found");
  }

  if (!membership) {
    throw new Error("user_not_in_room");
  }

  if (existingParticipant) {
    throw new Error("user_already_queued");
  }

  return tx.pingPongRoomParticipant.create({
    data: {
      roomId,
      userId,
      queuePosition: await getNextQueuePosition(tx, roomId),
    },
  });
}

export async function removeParticipantFromRoom(
  tx: Tx,
  roomId: string,
  participantId: string,
) {
  const participants = await tx.pingPongRoomParticipant.findMany({
    where: { roomId },
    orderBy: { queuePosition: "asc" },
    select: { id: true },
  });

  const nextQueue = participants.filter(
    (participant) => participant.id !== participantId,
  );

  if (nextQueue.length === participants.length) {
    throw new Error("participant_not_found");
  }

  await tx.pingPongRoomParticipant.delete({
    where: { id: participantId },
  });

  await reorderRoomQueue(
    tx,
    nextQueue.map((participant) => participant.id),
  );
}

export async function removeUserFromRoomQueue(
  tx: Tx,
  roomId: string,
  userId: string,
) {
  const [room, participant, queueCount] = await Promise.all([
    tx.pingPongRoom.findFirst({
      where: { id: roomId, deletedAt: null },
      select: { id: true },
    }),
    tx.pingPongRoomParticipant.findUnique({
      where: {
        roomId_userId: { roomId, userId },
      },
      select: { id: true, queuePosition: true },
    }),
    tx.pingPongRoomParticipant.count({
      where: { roomId },
    }),
  ]);

  if (!room) {
    throw new Error("room_not_found");
  }

  if (!participant) {
    throw new Error("user_not_queued");
  }

  if (participant.queuePosition < 2 && queueCount >= 2) {
    throw new Error("current_player_cannot_leave_queue");
  }

  await removeParticipantFromRoom(tx, roomId, participant.id);

  return participant;
}

export async function finishRoomMatch(
  tx: Tx,
  roomId: string,
  winnerParticipantId: string,
  actorUserId: string,
) {
  const room = await tx.pingPongRoom.findUnique({
    where: { id: roomId },
    select: { id: true },
  });

  if (!room) {
    throw new Error("room_not_found");
  }

  const queue = await tx.pingPongRoomParticipant.findMany({
    where: { roomId },
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
        roomId,
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
        action: "room_match_finished",
        metadata: {
          roomId,
          winnerId: winnerParticipant.userId,
          loserId: loserParticipant.userId,
          kFactor: MATCH_ELO_K,
        },
      },
    }),
  ]);

  await reorderRoomQueue(tx, reorderedQueueIds);

  return createdMatch;
}

export async function rollbackRoomMatch(
  tx: Tx,
  roomId: string,
  matchHistoryId: string,
  actorUserId: string,
) {
  const match = await tx.matchHistory.findFirst({
    where: { id: matchHistoryId, roomId },
    select: {
      id: true,
      roomId: true,
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
        roomId,
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
        action: "room_match_rolled_back",
        metadata: {
          roomId,
          matchHistoryId,
          winnerId: match.winnerId,
          loserId: match.loserId,
        },
      },
    }),
  ]);

  return rollback;
}
