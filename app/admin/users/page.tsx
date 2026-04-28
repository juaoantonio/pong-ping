import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainNav } from "@/components/main-nav";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { requireRole } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/roles";

export default async function AdminUsersPage() {
  const currentUser = await requireRole("admin");
  const [users, allowedEmails, invitations] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.authInvitation.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
        usedByEmail: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={currentUser.name ?? currentUser.email ?? "Usuario"} src={currentUser.avatarUrl ?? currentUser.image} />
            <div>
              <p className="text-sm text-muted-foreground">Painel administrativo</p>
              <h1 className="text-2xl font-semibold">Usuarios</h1>
            </div>
          </div>
          <MainNav role={currentUser.role} />
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de acesso</CardTitle>
            <CardDescription>
              Admins visualizam apenas users. Superadmins visualizam todos e podem alterar roles.
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
              allowedEmails={allowedEmails.map((allowedEmail) => ({
                id: allowedEmail.id,
                email: allowedEmail.email,
                createdAt: allowedEmail.createdAt.toISOString(),
                createdBy: allowedEmail.createdBy,
              }))}
              invitations={invitations.map((invitation) => ({
                id: invitation.id,
                expiresAt: invitation.expiresAt.toISOString(),
                usedAt: invitation.usedAt?.toISOString() ?? null,
                usedByEmail: invitation.usedByEmail,
                createdAt: invitation.createdAt.toISOString(),
                status: invitation.usedAt ? "Usado" : "Disponivel",
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
