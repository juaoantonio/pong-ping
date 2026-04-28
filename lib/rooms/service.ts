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

export async function addUserToRoom(tx: Tx, roomId: string, userId: string) {
  const [room, user, existingParticipant] = await Promise.all([
    tx.pingPongRoom.findUnique({
      where: { id: roomId },
      select: { id: true },
    }),
    tx.user.findUnique({
      where: { id: userId },
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

  if (!user) {
    throw new Error("user_not_found");
  }

  if (existingParticipant) {
    throw new Error("user_already_joined");
  }

  return tx.pingPongRoomParticipant.create({
    data: {
      roomId,
      userId,
      queuePosition: await getNextQueuePosition(tx, roomId),
    },
  });
}

export async function removeParticipantFromRoom(tx: Tx, roomId: string, participantId: string) {
  const participants = await tx.pingPongRoomParticipant.findMany({
    where: { roomId },
    orderBy: { queuePosition: "asc" },
    select: { id: true },
  });

  const nextQueue = participants.filter((participant) => participant.id !== participantId);

  if (nextQueue.length === participants.length) {
    throw new Error("participant_not_found");
  }

  await tx.pingPongRoomParticipant.delete({
    where: { id: participantId },
  });

  await Promise.all(
    nextQueue.map((participant, index) =>
      tx.pingPongRoomParticipant.update({
        where: { id: participant.id },
        data: { queuePosition: index },
      }),
    ),
  );
}

export async function finishRoomMatch(tx: Tx, roomId: string, winnerParticipantId: string, actorUserId: string) {
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
  const winnerParticipant = currentPlayers.find((participant) => participant.id === winnerParticipantId);
  const loserParticipant = currentPlayers.find((participant) => participant.id !== winnerParticipantId);

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

  const nextElo = calculateElo(winnerRanking.elo, loserRanking.elo, MATCH_ELO_K);
  const winnerWins = winnerRanking.wins + 1;
  const winnerTotalMatches = winnerRanking.total_matches + 1;
  const loserTotalMatches = loserRanking.total_matches + 1;

  const [createdMatch] = await Promise.all([
    tx.match.create({
      data: {
        roomId,
        winnerUserId: winnerParticipant.userId,
        loserUserId: loserParticipant.userId,
        createdById: actorUserId,
        kFactor: MATCH_ELO_K,
        winnerOldElo: winnerRanking.elo,
        winnerNewElo: nextElo.winnerElo,
        loserOldElo: loserRanking.elo,
        loserNewElo: nextElo.loserElo,
      },
      select: {
        id: true,
        winnerUserId: true,
        loserUserId: true,
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
          winnerUserId: winnerParticipant.userId,
          loserUserId: loserParticipant.userId,
          kFactor: MATCH_ELO_K,
        },
      },
    }),
  ]);

  await Promise.all(
    reorderedQueueIds.map((participantId, index) =>
      tx.pingPongRoomParticipant.update({
        where: { id: participantId },
        data: { queuePosition: index },
      }),
    ),
  );

  return createdMatch;
}
