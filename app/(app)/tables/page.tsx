import { Suspense } from "react";
import { CreateTableForm } from "@/components/tables/create-table-form";
import { TableList } from "@/components/tables/table-list";
import { PaginationControls } from "@/components/pagination-controls";
import { TablesGridSkeleton } from "@/components/page-skeletons";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { parseServerPaginationParams } from "@/lib/pagination";
import { getTableListItems } from "@/lib/tables/queries";

type TablesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function TablesListContent({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const result = await getTableListItems(
    parseServerPaginationParams(searchParams),
  );

  return (
    <div className="grid gap-4">
      <TableList tables={result.tables} />
      <PaginationControls
        itemLabel="mesas"
        pageInfo={result.pageInfo}
        pathname="/tables"
        searchParams={searchParams}
      />
    </div>
  );
}

export default async function TablesPage({ searchParams }: TablesPageProps) {
  const [user, params] = await Promise.all([requireAuth(), searchParams]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mesas</h1>
        </div>
        {canAccessAdmin(user.role) ? <CreateTableForm /> : null}
      </div>

      <Suspense fallback={<TablesGridSkeleton />}>
        <TablesListContent searchParams={params} />
      </Suspense>
    </div>
  );
}
