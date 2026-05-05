import { Suspense } from "react";
import {
  RoundsAdmin,
  type RoundAdminFilters,
} from "@/app/admin/rounds/rounds-admin";
import { getKnownTenantIdForActor } from "@/app/api/admin/_shared";
import { EmptyState, PageShell } from "@/components/page-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/session";
import {
  parseServerPaginationParams,
  type PaginationInput,
} from "@/lib/pagination";
import { getAdminRoundsReadModel } from "@/lib/contexts/competition/queries";

type AdminRoundsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function RoundsAdminSkeleton() {
  return (
    <div className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 border-y border-border py-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,2fr)_repeat(2,minmax(160px,1fr))]">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton className="h-20 w-full" key={index} />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid gap-0 divide-y divide-border border-y border-border">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="py-3" key={index}>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function RoundsAdminPanel({
  filters,
  pagination,
  searchParams,
  tenantId,
}: {
  filters: RoundAdminFilters;
  pagination: PaginationInput;
  searchParams: Record<string, string | string[] | undefined>;
  tenantId: string;
}) {
  const { pageInfo, rounds } = await getAdminRoundsReadModel(
    tenantId,
    filters,
    pagination,
  );

  return (
    <section className="grid gap-5 pt-5">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Historico auditavel</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Todas as rodadas e rollbacks, incluindo o table id de origem.
        </p>
      </div>
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
    </section>
  );
}

export default async function AdminRoundsPage({
  searchParams,
}: AdminRoundsPageProps) {
  const [actor, params] = await Promise.all([
    requireRole("superadmin"),
    searchParams,
  ]);
  const tenantId = await getKnownTenantIdForActor(actor);

  if (!tenantId) {
    return (
      <PageShell
        className="max-w-7xl"
        description="Audite rodadas, rollbacks e filtros de investigacao por tenant."
        eyebrow="Painel superadmin"
        title="Rodadas"
      >
        <EmptyState title="Historico indisponivel">
          Sem tenant associado ao usuario.
        </EmptyState>
      </PageShell>
    );
  }

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
    <PageShell
      className="max-w-7xl"
      description="Audite rodadas, rollbacks e filtros de investigacao por tenant."
      eyebrow="Painel superadmin"
      title="Rodadas"
    >
      <Suspense fallback={<RoundsAdminSkeleton />}>
        <RoundsAdminPanel
          filters={filters}
          pagination={pagination}
          searchParams={params}
          tenantId={tenantId}
        />
      </Suspense>
    </PageShell>
  );
}
