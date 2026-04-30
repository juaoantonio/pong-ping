import { Suspense } from "react";
import { connection } from "next/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { CardTableSkeleton } from "@/components/page-skeletons";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireRole, type AuthenticatedUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function UsersAdminPanel({
  currentUser,
}: {
  currentUser: AuthenticatedUser;
}) {
  await connection();

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
  );
}

export default async function AdminUsersPage() {
  const currentUser = await requireRole("admin");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
      </div>

      <Suspense fallback={<CardTableSkeleton rows={6} />}>
        <UsersAdminPanel currentUser={currentUser} />
      </Suspense>
    </div>
  );
}
