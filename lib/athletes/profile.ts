import "server-only";

import { cache } from "react";
import { connection } from "next/server";
import type {
  AthleteGripStyle,
  AthletePlayingStyle,
  AthleteTechnicalLevel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLAYER_ELO } from "@/lib/ranking/elo";

export type AthleteEditableProfile = {
  name: string | null;
  technicalLevel: AthleteTechnicalLevel | null;
  gripStyle: AthleteGripStyle | null;
  playingStyle: AthletePlayingStyle | null;
  bladeName: string | null;
  forehandRubberName: string | null;
  backhandRubberName: string | null;
  equipmentNotes: string | null;
};

export type AthleteRankingSummary = {
  position: number | null;
  elo: number;
  wins: number;
  totalMatches: number;
  winRate: number;
  rankLevelName: string | null;
};

export type AthleteEvolutionPoint = {
  matchId: string;
  finishedAt: Date;
  opponentName: string;
  result: "win" | "loss";
  oldElo: number;
  newElo: number;
  diffPoints: number;
};

export type AthleteProfileView = {
  editable: AthleteEditableProfile;
  ranking: AthleteRankingSummary;
  evolution: AthleteEvolutionPoint[];
};

type RankingUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    playerRanking: {
      select: {
        elo: true;
        wins: true;
        total_matches: true;
        winRate: true;
      };
    };
  };
}>;

type EvolutionMatch = Prisma.MatchHistoryGetPayload<{
  select: {
    id: true;
    winnerId: true;
    loserId: true;
    winnerOldElo: true;
    winnerNewElo: true;
    winnerDiffPoints: true;
    loserOldElo: true;
    loserNewElo: true;
    loserDiffPoints: true;
    finishedAt: true;
    winner: {
      select: {
        name: true;
        email: true;
      };
    };
    loser: {
      select: {
        name: true;
        email: true;
      };
    };
  };
}>;

const DEFAULT_RANKING = {
  elo: DEFAULT_PLAYER_ELO,
  wins: 0,
  total_matches: 0,
  winRate: 0,
};

function getRanking(user: RankingUser) {
  return user.playerRanking ?? DEFAULT_RANKING;
}

function getRankingLabel(user: Pick<RankingUser, "name" | "email">) {
  return user.name ?? user.email ?? "";
}

function compareRankingUsers(first: RankingUser, second: RankingUser) {
  const firstRanking = getRanking(first);
  const secondRanking = getRanking(second);

  if (secondRanking.elo !== firstRanking.elo) {
    return secondRanking.elo - firstRanking.elo;
  }

  if (secondRanking.wins !== firstRanking.wins) {
    return secondRanking.wins - firstRanking.wins;
  }

  const labelComparison = getRankingLabel(first).localeCompare(
    getRankingLabel(second),
  );

  return labelComparison === 0
    ? first.id.localeCompare(second.id)
    : labelComparison;
}

function getOpponentName(opponent: { name: string | null; email: string | null }) {
  return opponent.name ?? opponent.email ?? "Sem nome";
}

export function mapAthleteEvolutionPoint(
  match: EvolutionMatch,
  userId: string,
): AthleteEvolutionPoint {
  const isWinner = match.winnerId === userId;

  return {
    matchId: match.id,
    finishedAt: match.finishedAt,
    opponentName: getOpponentName(isWinner ? match.loser : match.winner),
    result: isWinner ? "win" : "loss",
    oldElo: isWinner ? match.winnerOldElo : match.loserOldElo,
    newElo: isWinner ? match.winnerNewElo : match.loserNewElo,
    diffPoints: isWinner ? match.winnerDiffPoints : match.loserDiffPoints,
  };
}

export const getCurrentAthleteProfile = cache(async (
  userId: string,
  tenantId: string,
  options: { evolutionLimit?: number } = {},
): Promise<AthleteProfileView> => {
  await connection();

  const evolutionLimit = options.evolutionLimit ?? 10;
  const [user, tenantUsers, rankLevels, evolutionMatches] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        name: true,
        athleteProfile: {
          select: {
            technicalLevel: true,
            gripStyle: true,
            playingStyle: true,
            bladeName: true,
            forehandRubberName: true,
            backhandRubberName: true,
            equipmentNotes: true,
          },
        },
        playerRanking: {
          select: {
            elo: true,
            wins: true,
            total_matches: true,
            winRate: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        playerRanking: {
          select: {
            elo: true,
            wins: true,
            total_matches: true,
            winRate: true,
          },
        },
      },
    }),
    prisma.rankLevel.findMany({
      orderBy: { minElo: "desc" },
      select: {
        name: true,
        minElo: true,
      },
    }),
    prisma.matchHistory.findMany({
      where: {
        tenantId,
        kind: "match",
        OR: [{ winnerId: userId }, { loserId: userId }],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: evolutionLimit,
      select: {
        id: true,
        winnerId: true,
        loserId: true,
        winnerOldElo: true,
        winnerNewElo: true,
        winnerDiffPoints: true,
        loserOldElo: true,
        loserNewElo: true,
        loserDiffPoints: true,
        finishedAt: true,
        winner: {
          select: {
            name: true,
            email: true,
          },
        },
        loser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const sortedUsers = [...tenantUsers].sort(compareRankingUsers);
  const rankingPosition = sortedUsers.findIndex((item) => item.id === userId);
  const ranking = user?.playerRanking ?? DEFAULT_RANKING;
  const rankLevel = rankLevels.find((level) => ranking.elo >= level.minElo);

  return {
    editable: {
      name: user?.name ?? null,
      technicalLevel: user?.athleteProfile?.technicalLevel ?? null,
      gripStyle: user?.athleteProfile?.gripStyle ?? null,
      playingStyle: user?.athleteProfile?.playingStyle ?? null,
      bladeName: user?.athleteProfile?.bladeName ?? null,
      forehandRubberName: user?.athleteProfile?.forehandRubberName ?? null,
      backhandRubberName: user?.athleteProfile?.backhandRubberName ?? null,
      equipmentNotes: user?.athleteProfile?.equipmentNotes ?? null,
    },
    ranking: {
      position: rankingPosition >= 0 ? rankingPosition + 1 : null,
      elo: ranking.elo,
      wins: ranking.wins,
      totalMatches: ranking.total_matches,
      winRate: ranking.winRate,
      rankLevelName: rankLevel?.name ?? null,
    },
    evolution: evolutionMatches.map((match) =>
      mapAthleteEvolutionPoint(match, userId),
    ),
  };
});
