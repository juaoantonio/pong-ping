import { connection } from "next/server";
import { TenantsAdmin } from "@/app/admin/tenants/tenants-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AdminTenantsPage() {
  const currentUser = await requireRole("admin");

  if (!isSuperAdmin(currentUser)) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Painel administrativo
          </p>
          <h1 className="text-2xl font-semibold">Tenants</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Somente superadmins podem gerenciar tenants.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
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
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Tenants</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de tenants</CardTitle>
          <CardDescription>
            Crie organizacoes isoladas para login, ranking, mesas e convites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantsAdmin
            tenants={tenants.map((tenant) => ({
              id: tenant.id,
              name: tenant.name,
              slug: tenant.slug,
              createdAt: tenant.createdAt.toISOString(),
              userCount: tenant._count.users,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
