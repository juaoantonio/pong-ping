import "server-only";

import { prisma } from "@/lib/prisma";

export async function getRoomListItems() {
  const rooms = await prisma.pingPongRoom.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
          email: true,
          avatarUrl: true,
          image: true,
        },
      },
      participants: {
        orderBy: { queuePosition: "asc" },
        select: {
          user: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
            },
          },
        },
      },
      matches: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          createdAt: true,
          winnerOldElo: true,
          winnerNewElo: true,
          loserOldElo: true,
          loserNewElo: true,
          winner: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
            },
          },
          loser: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return rooms.map((room) => ({
    id: room.id,
    name: room.name,
    createdAt: room.createdAt.toISOString(),
    createdBy: {
      name: room.createdBy.name,
      email: room.createdBy.email,
      avatarUrl: room.createdBy.avatarUrl ?? room.createdBy.image,
    },
    participantCount: room.participants.length,
    currentPlayers: room.participants.slice(0, 2).map((participant) => ({
      name: participant.user.name,
      email: participant.user.email,
      avatarUrl: participant.user.avatarUrl ?? participant.user.image,
    })),
    latestMatch: room.matches[0]
      ? {
          id: room.matches[0].id,
          createdAt: room.matches[0].createdAt.toISOString(),
          winnerOldElo: room.matches[0].winnerOldElo,
          winnerNewElo: room.matches[0].winnerNewElo,
          loserOldElo: room.matches[0].loserOldElo,
          loserNewElo: room.matches[0].loserNewElo,
          winner: {
            ...room.matches[0].winner,
            avatarUrl:
              room.matches[0].winner.avatarUrl ?? room.matches[0].winner.image,
          },
          loser: {
            ...room.matches[0].loser,
            avatarUrl:
              room.matches[0].loser.avatarUrl ?? room.matches[0].loser.image,
          },
        }
      : null,
  }));
}

export async function getRoomDetail(roomId: string) {
  const room = await prisma.pingPongRoom.findUnique({
    where: { id: roomId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      invitations: {
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          token: true,
          expiresAt: true,
        },
      },
      participants: {
        orderBy: { queuePosition: "asc" },
        select: {
          id: true,
          queuePosition: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
              playerRanking: {
                select: {
                  elo: true,
                  wins: true,
                  total_matches: true,
                  winRate: true,
                },
              },
            },
          },
        },
      },
      matches: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          winnerOldElo: true,
          winnerNewElo: true,
          loserOldElo: true,
          loserNewElo: true,
          winner: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
            },
          },
          loser: {
            select: {
              name: true,
              email: true,
              avatarUrl: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    return null;
  }

  return {
    id: room.id,
    name: room.name,
    createdAt: room.createdAt.toISOString(),
    createdBy: room.createdBy,
    currentInvitation: room.invitations[0]
      ? {
          id: room.invitations[0].id,
          token: room.invitations[0].token,
          expiresAt: room.invitations[0].expiresAt.toISOString(),
        }
      : null,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      queuePosition: participant.queuePosition,
      joinedAt: participant.joinedAt.toISOString(),
      user: {
        id: participant.user.id,
        name: participant.user.name,
        email: participant.user.email,
        avatarUrl: participant.user.avatarUrl ?? participant.user.image,
        playerRanking: participant.user.playerRanking,
      },
    })),
    recentMatches: room.matches.map((match) => ({
      id: match.id,
      createdAt: match.createdAt.toISOString(),
      winnerOldElo: match.winnerOldElo,
      winnerNewElo: match.winnerNewElo,
      loserOldElo: match.loserOldElo,
      loserNewElo: match.loserNewElo,
      winner: {
        ...match.winner,
        avatarUrl: match.winner.avatarUrl ?? match.winner.image,
      },
      loser: {
        ...match.loser,
        avatarUrl: match.loser.avatarUrl ?? match.loser.image,
      },
    })),
  };
}

export async function getRoomUserOptions() {
  const users = await prisma.user.findMany({
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      image: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? user.image,
  }));
}
