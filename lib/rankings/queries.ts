import "server-only";

import { existsSync } from "fs";
import { join } from "path";
import { cache } from "react";
import { connection } from "next/server";
import {
  getPageInfo,
  getPaginationOffset,
  type PaginationInput,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PLAYER_ELO } from "@/lib/ranking/elo";

export const getPublicRankings = cache(async (pagination: PaginationInput) => {
  await connection();

  const totalCount = await prisma.user.count();
  const pageInfo = getPageInfo(pagination, totalCount);
  const [users, rankLevels] = await Promise.all([
    prisma.user.findMany({
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

  const offset = getPaginationOffset(pageInfo);

  return {
    pageInfo,
    rankings: users
      .map((user) => {
        const ranking = user.playerRanking ?? {
          elo: DEFAULT_PLAYER_ELO,
          wins: 0,
          total_matches: 0,
          winRate: 0,
        };
        const rankLevel = rankLevels.find(
          (level) => ranking.elo >= level.minElo,
        );
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

        const firstLabel = first.name ?? first.email ?? "";
        const secondLabel = second.name ?? second.email ?? "";
        const labelComparison = firstLabel.localeCompare(secondLabel);

        return labelComparison === 0
          ? first.id.localeCompare(second.id)
          : labelComparison;
      })
      .slice(offset, offset + pageInfo.pageSize),
  };
});
