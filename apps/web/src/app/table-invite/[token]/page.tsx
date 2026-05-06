import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { TableInviteForm } from "@/app/table-invite/[token]/table-invite-form";
import { getActorTenantId } from "@/lib/tables/tenant";

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
      tenantId: true,
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
  const tenantId = getActorTenantId(currentUser);

  if (
    !invitation ||
    invitation.tenantId !== tenantId ||
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
      <section className="grid w-full max-w-2xl gap-6">
        <header className="grid gap-4 border-b border-border/80 pb-5">
          <div className="grid gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              Convite para mesa
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Entrar na mesa
            </h1>
            <p className="text-sm leading-6 text-muted-foreground text-pretty">
              {currentUser.name ?? currentUser.email ?? "Usuario"}, voce foi
              convidado para a mesa{" "}
              <strong className="font-semibold text-foreground">
                {invitation.table.name}
              </strong>{" "}
              criada por {creatorName}.
            </p>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">Mesa</dt>
              <dd className="break-words font-medium text-foreground">
                {invitation.table.name}
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="font-medium text-muted-foreground">Criada por</dt>
              <dd className="break-words text-foreground">{creatorName}</dd>
            </div>
          </dl>
        </header>

        <section className="grid gap-4 border-t border-border pt-5">
          <div className="grid gap-1">
            <h2 className="text-base font-semibold">Confirmar entrada</h2>
            <p className="text-sm text-muted-foreground">
              Ao aceitar, voce entra na mesa imediatamente e pode entrar na fila
              quando estiver pronto.
            </p>
          </div>
          <TableInviteForm
            expiresAt={invitation.expiresAt.toISOString()}
            tableName={invitation.table.name}
            token={token}
          />
        </section>

        <div className="border-t border-border pt-4">
          <Link className={buttonVariants({ variant: "ghost" })} href="/tables">
            Voltar as mesas
          </Link>
        </div>
      </section>
    </main>
  );
}
