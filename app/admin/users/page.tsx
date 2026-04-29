import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const currentUser = await requireRole("admin");
  const users = await prisma.user.findMany({
    where: isSuperAdmin(currentUser) ? undefined : { role: "user" },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de usuarios</CardTitle>
          <CardDescription>
            Admins visualizam apenas users. Superadmins visualizam todos e podem
            alterar roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersAdmin
            currentUser={{ id: currentUser.id, role: currentUser.role }}
            users={users.map((user) => ({
              id: user.id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl ?? user.image,
              role: user.role,
              createdAt: user.createdAt.toISOString(),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
