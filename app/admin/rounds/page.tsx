import { Suspense } from "react";
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
  parseServerPaginationParams,
  type PaginationInput,
} from "@/lib/pagination";
import { getAdminRoundsReadModel } from "@/lib/contexts/competition/queries";

type AdminRoundsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
  const { pageInfo, rounds } = await getAdminRoundsReadModel(
    filters,
    pagination,
  );

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
          rounds={rounds}
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
