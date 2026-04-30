import "server-only";

import { existsSync } from "fs";
import { join } from "path";
import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLAYER_ELO } from "@/lib/ranking/elo";

export const getPublicRankings = cache(async () => {
  await connection();

  const [users, rankLevels] = await Promise.all([
    prisma.user.findMany({
      orderBy: [
        { playerRanking: { elo: "desc" } },
        { playerRanking: { wins: "desc" } },
        { name: "asc" },
      ],
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
        iconImgKey: true,
      },
    }),
  ]);

  return users
    .map((user) => {
      const ranking = user.playerRanking ?? {
        elo: DEFAULT_PLAYER_ELO,
        wins: 0,
        total_matches: 0,
        winRate: 0,
      };
      const rankLevel = rankLevels.find((level) => ranking.elo >= level.minElo);
      const rankIconExists = rankLevel
        ? existsSync(join(process.cwd(), "public", rankLevel.iconImgKey))
        : false;

      return {
        ...user,
        ranking,
        rankLevel,
        rankIconExists,
      };
    })
    .sort((first, second) => {
      if (second.ranking.elo !== first.ranking.elo) {
        return second.ranking.elo - first.ranking.elo;
      }

      if (second.ranking.wins !== first.ranking.wins) {
        return second.ranking.wins - first.ranking.wins;
      }

      return (first.name ?? first.email ?? "").localeCompare(
        second.name ?? second.email ?? "",
      );
    });
});
