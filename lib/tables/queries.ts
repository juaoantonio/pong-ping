import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";

export const getTableListItems = cache(async () => {
  await connection();

  const tables = await prisma.pingPongTable.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      deletedAt: null,
    },
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
      matchHistories: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          kind: true,
          rollbackOfId: true,
          createdAt: true,
          winnerOldElo: true,
          winnerNewElo: true,
          winnerDiffPoints: true,
          loserOldElo: true,
          loserNewElo: true,
          loserDiffPoints: true,
          rollbacks: {
            select: { id: true },
            take: 1,
          },
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

  return tables.map((table) => ({
    id: table.id,
    name: table.name,
    createdAt: table.createdAt.toISOString(),
    createdBy: {
      name: table.createdBy.name,
      email: table.createdBy.email,
      avatarUrl: table.createdBy.avatarUrl ?? table.createdBy.image,
    },
    participantCount: table.participants.length,
    currentPlayers: table.participants.slice(0, 2).map((participant) => ({
      name: participant.user.name,
      email: participant.user.email,
      avatarUrl: participant.user.avatarUrl ?? participant.user.image,
    })),
    latestMatch: table.matchHistories[0]
      ? {
          id: table.matchHistories[0].id,
          kind: table.matchHistories[0].kind,
          rollbackOfId: table.matchHistories[0].rollbackOfId,
          rolledBack: table.matchHistories[0].rollbacks.length > 0,
          createdAt: table.matchHistories[0].createdAt.toISOString(),
          winnerOldElo: table.matchHistories[0].winnerOldElo,
          winnerNewElo: table.matchHistories[0].winnerNewElo,
          winnerDiffPoints: table.matchHistories[0].winnerDiffPoints,
          loserOldElo: table.matchHistories[0].loserOldElo,
          loserNewElo: table.matchHistories[0].loserNewElo,
          loserDiffPoints: table.matchHistories[0].loserDiffPoints,
          winner: {
            ...table.matchHistories[0].winner,
            avatarUrl:
              table.matchHistories[0].winner.avatarUrl ??
              table.matchHistories[0].winner.image,
          },
          loser: {
            ...table.matchHistories[0].loser,
            avatarUrl:
              table.matchHistories[0].loser.avatarUrl ??
              table.matchHistories[0].loser.image,
          },
        }
      : null,
  }));
});

export const getTableDetail = cache(
  async (tableId: string, viewerUserId: string) => {
    await connection();

    const table = await prisma.pingPongTable.findUnique({
      where: { id: tableId },
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
            OR: [{ oneTimeUse: false }, { usedAt: null }],
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            token: true,
            expiresAt: true,
            oneTimeUse: true,
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
        members: {
          select: {
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                image: true,
              },
            },
          },
        },
        matchHistories: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            kind: true,
            rollbackOfId: true,
            createdAt: true,
            winnerOldElo: true,
            winnerNewElo: true,
            winnerDiffPoints: true,
            loserOldElo: true,
            loserNewElo: true,
            loserDiffPoints: true,
            rollbacks: {
              select: { id: true },
              take: 1,
            },
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

    if (!table) {
      return null;
    }

    const currentPlayers = table.participants.slice(0, 2);
    const viewerMember = table.members.find(
      (member) => member.user.id === viewerUserId,
    );
    const viewerParticipant = table.participants.find(
      (participant) => participant.user.id === viewerUserId,
    );
    const viewerIsPlaying =
      currentPlayers.length === 2 &&
      currentPlayers.some(
        (participant) => participant.user.id === viewerUserId,
      );

    return {
      id: table.id,
      name: table.name,
      createdAt: table.createdAt.toISOString(),
      createdBy: table.createdBy,
      currentInvitation: table.invitations[0]
        ? {
            id: table.invitations[0].id,
            token: table.invitations[0].token,
            expiresAt: table.invitations[0].expiresAt.toISOString(),
            oneTimeUse: table.invitations[0].oneTimeUse,
          }
        : null,
      participants: table.participants.map((participant) => ({
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
      members: table.members.map((member) => ({
        joinedAt: member.joinedAt.toISOString(),
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          avatarUrl: member.user.avatarUrl ?? member.user.image,
        },
      })),
      viewerIsMember: Boolean(viewerMember),
      viewerIsQueued: Boolean(viewerParticipant),
      viewerIsPlaying,
      viewerQueuePosition: viewerParticipant?.queuePosition ?? null,
      recentMatches: table.matchHistories.map((match) => ({
        id: match.id,
        kind: match.kind,
        rollbackOfId: match.rollbackOfId,
        rolledBack: match.rollbacks.length > 0,
        createdAt: match.createdAt.toISOString(),
        winnerOldElo: match.winnerOldElo,
        winnerNewElo: match.winnerNewElo,
        winnerDiffPoints: match.winnerDiffPoints,
        loserOldElo: match.loserOldElo,
        loserNewElo: match.loserNewElo,
        loserDiffPoints: match.loserDiffPoints,
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
  },
);

export const getTableUserOptions = cache(async () => {
  await connection();

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
});
