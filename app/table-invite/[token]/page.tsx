import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { TableInviteForm } from "@/app/table-invite/[token]/table-invite-form";

type TableInvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function TableInvitePage({
  params,
}: TableInvitePageProps) {
  const currentUserPromise = requireAuth();
  const { token } = await params;
  const now = new Date();

  await connection();

  const invitationPromise = prisma.pingPongTableInvitation.findUnique({
    where: { token },
    select: {
      expiresAt: true,
      oneTimeUse: true,
      usedAt: true,
      table: {
        select: {
          id: true,
          name: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
  const [currentUser, invitation] = await Promise.all([
    currentUserPromise,
    invitationPromise,
  ]);

  if (
    !invitation ||
    invitation.expiresAt < now ||
    (invitation.oneTimeUse && invitation.usedAt)
  ) {
    notFound();
  }

  const creatorName =
    invitation.table.createdBy.name ??
    invitation.table.createdBy.email ??
    "Criador da mesa";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Entrar na mesa</CardTitle>
          <CardDescription>
            {currentUser.name ?? currentUser.email ?? "Usuario"}, voce foi
            convidado para a mesa <strong>{invitation.table.name}</strong>{" "}
            criada por {creatorName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <TableInviteForm
            expiresAt={invitation.expiresAt.toISOString()}
            tableName={invitation.table.name}
            token={token}
          />
          <Link className={buttonVariants({ variant: "ghost" })} href="/tables">
            Voltar as mesas
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
