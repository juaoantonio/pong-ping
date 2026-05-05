import "server-only";

import { connection } from "next/server";
import { Prisma } from "@prisma/client";
import {
  getPageInfo,
  getPaginationOffset,
  type PaginationInput,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export type AdminRoundsReadFilters = {
  q: string;
  tableId: string;
  player: string;
  createdBy: string;
  kind: string;
  status: string;
  from: string;
  to: string;
};

export type AdminRoundReadModel = {
  id: string;
  tableId: string | null;
  rollbackOfId: string | null;
  rolledBack: boolean;
  kind: "match" | "rollback";
  winnerOldElo: number;
  winnerNewElo: number;
  winnerDiffPoints: number;
  loserOldElo: number;
  loserNewElo: number;
  loserDiffPoints: number;
  createdAt: string;
  tableName: string | null;
  winner: {
    name: string | null;
    email: string | null;
  };
  loser: {
    name: string | null;
    email: string | null;
  };
  createdBy: {
    name: string | null;
    email: string | null;
  };
};

function dateFromInput(value: string | undefined, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(
    `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`,
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function textContains(value: string): Prisma.StringFilter {
  return { contains: value, mode: "insensitive" };
}

function getAdminRoundsWhere(filters: AdminRoundsReadFilters) {
  const and: Prisma.MatchHistoryWhereInput[] = [];

  if (filters.q) {
    const q = filters.q;
    and.push({
      OR: [
        { id: textContains(q) },
        { tableId: textContains(q) },
        { rollbackOfId: textContains(q) },
        { table: { name: textContains(q) } },
        { winner: { name: textContains(q) } },
        { winner: { email: textContains(q) } },
        { loser: { name: textContains(q) } },
        { loser: { email: textContains(q) } },
        { createdBy: { name: textContains(q) } },
        { createdBy: { email: textContains(q) } },
      ],
    });
  }

  if (filters.tableId) {
    and.push({ tableId: textContains(filters.tableId) });
  }

  if (filters.kind === "match" || filters.kind === "rollback") {
    and.push({ kind: filters.kind });
  }

  if (filters.status === "rolled_back") {
    and.push({ kind: "match", rollbacks: { some: {} } });
  }

  if (filters.status === "rollback_available") {
    and.push({ kind: "match", rollbacks: { none: {} } });
  }

  if (filters.status === "rollback_record") {
    and.push({ kind: "rollback" });
  }

  if (filters.player) {
    const player = filters.player;
    and.push({
      OR: [
        { winner: { name: textContains(player) } },
        { winner: { email: textContains(player) } },
        { loser: { name: textContains(player) } },
        { loser: { email: textContains(player) } },
      ],
    });
  }

  if (filters.createdBy) {
    const createdBy = filters.createdBy;
    and.push({
      OR: [
        { createdBy: { name: textContains(createdBy) } },
        { createdBy: { email: textContains(createdBy) } },
      ],
    });
  }

  const createdAt: Prisma.DateTimeFilter = {};
  const from = dateFromInput(filters.from);
  const to = dateFromInput(filters.to, true);

  if (from) {
    createdAt.gte = from;
  }

  if (to) {
    createdAt.lte = to;
  }

  if (from || to) {
    and.push({ createdAt });
  }

  return and.length > 0 ? { AND: and } : undefined;
}

export async function getAdminRoundsReadModel(
  filters: AdminRoundsReadFilters,
  pagination: PaginationInput,
) {
  await connection();

  const where = getAdminRoundsWhere(filters);
  const totalCount = await prisma.matchHistory.count({ where });
  const pageInfo = getPageInfo(pagination, totalCount);
  const rounds = await prisma.matchHistory.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: getPaginationOffset(pageInfo),
    take: pageInfo.pageSize,
    select: {
      id: true,
      tableId: true,
      rollbackOfId: true,
      kind: true,
      winnerOldElo: true,
      winnerNewElo: true,
      winnerDiffPoints: true,
      loserOldElo: true,
      loserNewElo: true,
      loserDiffPoints: true,
      createdAt: true,
      table: {
        select: {
          name: true,
        },
      },
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
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      rollbacks: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  return {
    pageInfo,
    rounds: rounds.map(
      (round): AdminRoundReadModel => ({
        id: round.id,
        tableId: round.tableId,
        rollbackOfId: round.rollbackOfId,
        rolledBack: round.rollbacks.length > 0,
        kind: round.kind,
        winnerOldElo: round.winnerOldElo,
        winnerNewElo: round.winnerNewElo,
        winnerDiffPoints: round.winnerDiffPoints,
        loserOldElo: round.loserOldElo,
        loserNewElo: round.loserNewElo,
        loserDiffPoints: round.loserDiffPoints,
        createdAt: round.createdAt.toISOString(),
        tableName: round.table?.name ?? null,
        winner: round.winner,
        loser: round.loser,
        createdBy: round.createdBy,
      }),
    ),
  };
}
