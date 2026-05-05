import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { TableDetail } from "@/components/tables/table-detail";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getTableDetail, getTableUserOptions } from "@/lib/tables/queries";
import { getActorTenantId } from "@/lib/tables/tenant";

type TablePageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function TablePage({ params }: TablePageProps) {
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { tableId }] = await Promise.all([userPromise, paramsPromise]);
  const tenantId = getActorTenantId(user);

  if (!tenantId) {
    redirect("/unauthorized");
  }

  const table = await getTableDetail(tableId, user.id, tenantId);

  if (!table) {
    notFound();
  }

  const canManage = canAccessAdmin(user.role);
  const users = canManage ? await getTableUserOptions(tenantId) : [];

  return (
    <PageShell
      description="Controle a rodada atual, a fila de espera, convites e histórico da mesa."
      title={table.name}
    >
      <TableDetail canManage={canManage} table={table} users={users} />
    </PageShell>
  );
}
