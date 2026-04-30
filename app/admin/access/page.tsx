import { Suspense } from "react";
import { connection } from "next/server";
import { AccessAdmin } from "@/app/admin/access/access-admin";
import { CardTableSkeleton } from "@/components/page-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

async function AccessAdminPanel() {
  await connection();

  const now = new Date();
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
        oneTimeUse: true,
        usedAt: true,
        usedByEmail: true,
        createdAt: true,
      },
    }),
  ]);

  return (
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
            oneTimeUse: invitation.oneTimeUse,
            usedAt: invitation.usedAt?.toISOString() ?? null,
            usedByEmail: invitation.usedByEmail,
            createdAt: invitation.createdAt.toISOString(),
            status:
              invitation.expiresAt <= now
                ? "Expirado"
                : invitation.oneTimeUse && invitation.usedAt
                  ? "Usado"
                  : invitation.oneTimeUse
                    ? "Disponivel"
                    : "Reutilizavel",
          }))}
        />
      </CardContent>
    </Card>
  );
}

export default async function AdminAccessPage() {
  await requireRole("admin");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Acesso</h1>
      </div>

      <Suspense fallback={<CardTableSkeleton rows={5} />}>
        <AccessAdminPanel />
      </Suspense>
    </div>
  );
}
