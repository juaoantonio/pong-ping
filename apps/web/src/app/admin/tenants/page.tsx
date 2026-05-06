import { connection } from "next/server";
import { TenantsAdmin } from "@/app/admin/tenants/tenants-admin";
import { EmptyState, PageShell } from "@/components/page-shell";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AdminTenantsPage() {
  const currentUser = await requireRole("admin");

  if (!isSuperAdmin(currentUser)) {
    return (
      <PageShell
        description="Somente superadmins podem criar e inspecionar tenants."
        eyebrow="Painel administrativo"
        title="Tenants"
      >
        <EmptyState title="Acesso restrito">
          Somente superadmins podem gerenciar tenants.
        </EmptyState>
      </PageShell>
    );
  }

  await connection();

  const tenants = await prisma.tenant.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return (
    <PageShell
      description="Crie organizacoes isoladas para login, ranking, mesas e convites."
      eyebrow="Painel administrativo"
      title="Tenants"
    >
      <section className="grid gap-5 pt-5">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Gerenciamento de tenants</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Crie organizacoes isoladas para login, ranking, mesas e convites.
          </p>
        </div>
        <TenantsAdmin
          tenants={tenants.map((tenant) => ({
            id: tenant.id,
            name: tenant.name,
            slug: tenant.slug,
            createdAt: tenant.createdAt.toISOString(),
            userCount: tenant._count.users,
          }))}
        />
      </section>
    </PageShell>
  );
}
