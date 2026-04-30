import { notFound } from "next/navigation";
import { TableDetail } from "@/components/tables/table-detail";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getTableDetail, getTableUserOptions } from "@/lib/tables/queries";

type TablePageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function TablePage({ params }: TablePageProps) {
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { tableId }] = await Promise.all([userPromise, paramsPromise]);
  const table = await getTableDetail(tableId, user.id);

  if (!table) {
    notFound();
  }

  const canManage = canAccessAdmin(user.role);
  const users = canManage ? await getTableUserOptions() : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <TableDetail canManage={canManage} table={table} users={users} />
    </div>
  );
}
