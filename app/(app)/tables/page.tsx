import { Suspense } from "react";
import { CreateTableForm } from "@/components/tables/create-table-form";
import { TableList } from "@/components/tables/table-list";
import { TablesGridSkeleton } from "@/components/page-skeletons";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getTableListItems } from "@/lib/tables/queries";

async function TablesListContent() {
  const tables = await getTableListItems();

  return <TableList tables={tables} />;
}

export default async function TablesPage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Mesas</h1>
        </div>
        {canAccessAdmin(user.role) ? <CreateTableForm /> : null}
      </div>

      <Suspense fallback={<TablesGridSkeleton />}>
        <TablesListContent />
      </Suspense>
    </div>
  );
}
