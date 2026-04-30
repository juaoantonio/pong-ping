import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RoundsAdmin,
  type RoundAdminFilters,
} from "@/app/admin/rounds/rounds-admin";
import { PaginationControls } from "@/components/pagination-controls";
import { CardTableSkeleton } from "@/components/page-skeletons";
import { requireRole } from "@/lib/auth/session";
import {
  getPageInfo,
  getPaginationOffset,
  parseServerPaginationParams,
  type PaginationInput,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type AdminRoundsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

async function RoundsAdminPanel({
  filters,
  pagination,
  searchParams,
}: {
  filters: RoundAdminFilters;
  pagination: PaginationInput;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await connection();

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

  const where = and.length > 0 ? { AND: and } : undefined;
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico auditavel</CardTitle>
        <CardDescription>
          Todas as rodadas e rollbacks, incluindo o table id de origem.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <RoundsAdmin
          filters={filters}
          pageSize={pageInfo.pageSize}
          rounds={rounds.map((round) => ({
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
          }))}
        />
        <PaginationControls
          itemLabel="rodadas"
          pageInfo={pageInfo}
          pathname="/admin/rounds"
          searchParams={searchParams}
        />
      </CardContent>
    </Card>
  );
}

export default async function AdminRoundsPage({
  searchParams,
}: AdminRoundsPageProps) {
  const [, params] = await Promise.all([
    requireRole("superadmin"),
    searchParams,
  ]);
  const filters: RoundAdminFilters = {
    q: firstParam(params.q)?.trim() ?? "",
    tableId: firstParam(params.tableId)?.trim() ?? "",
    player: firstParam(params.player)?.trim() ?? "",
    createdBy: firstParam(params.createdBy)?.trim() ?? "",
    kind: firstParam(params.kind) ?? "all",
    status: firstParam(params.status) ?? "all",
    from: firstParam(params.from) ?? "",
    to: firstParam(params.to) ?? "",
  };
  const pagination = parseServerPaginationParams(params);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel superadmin</p>
        <h1 className="text-2xl font-semibold">Rodadas</h1>
      </div>

      <Suspense fallback={<CardTableSkeleton rows={8} />}>
        <RoundsAdminPanel
          filters={filters}
          pagination={pagination}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
