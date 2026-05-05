import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { TableDetail } from "@/components/tables/table-detail";
import { canAccessAdmin } from "@/lib/auth/roles";
import { requireAuth } from "@/lib/auth/session";
import { getTableDetail } from "@/lib/tables/queries";
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

  return (
    <PageShell
      description="Acompanhe a rodada atual, a fila de espera e sua próxima ação."
      title={table.name}
    >
      <TableDetail canManage={canManage} table={table} />
    </PageShell>
  );
}
