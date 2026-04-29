import { AccessAdmin } from "@/app/admin/access/access-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessPage() {
  await requireRole("admin");
  const [allowedEmails, invitations] = await Promise.all([
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
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Acesso</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de acesso</CardTitle>
          <CardDescription>
            Autorize emails e crie convites de login com validade curta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessAdmin
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
  );
}
