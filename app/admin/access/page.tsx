import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AccessAdmin } from "@/app/admin/access/access-admin";
import { PageShell } from "@/components/page-shell";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth/session";
import {
  getPageInfo,
  getPaginationOffset,
  parseServerPaginationParams,
  type PaginationInput,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type AdminAccessPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AccessAdminSkeleton() {
  return (
    <div className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-32 md:self-end" />
      </div>
      <div className="grid gap-3 md:grid-cols-[minmax(160px,180px)_minmax(160px,180px)_auto_minmax(0,1fr)_auto]">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-32 md:self-end" />
        <Skeleton className="h-10 w-full md:self-end" />
        <Skeleton className="h-10 w-10 md:self-end" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <div className="grid gap-2" key={sectionIndex}>
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-0 divide-y divide-border border-y border-border">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div className="py-3" key={rowIndex}>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}

async function AccessAdminPanel({
  pagination,
  searchParams,
  tenantId,
}: {
  pagination: PaginationInput;
  searchParams: Record<string, string | string[] | undefined>;
  tenantId: string;
}) {
  await connection();

  const now = new Date();
  const tenantWhere = { tenantId };
  const totalCount = await prisma.allowedEmail.count({
    where: tenantWhere,
  } as never);
  const pageInfo = getPageInfo(pagination, totalCount);
  const [allowedEmails, invitations] = await Promise.all([
    prisma.allowedEmail.findMany({
      where: tenantWhere,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: getPaginationOffset(pageInfo),
      take: pageInfo.pageSize,
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
      where: tenantWhere,
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
    <section className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Gerenciamento de acesso</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Autorize emails e crie convites de login com validade curta.
        </p>
      </div>
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
      <PaginationControls
        itemLabel="emails"
        pageInfo={pageInfo}
        pathname="/admin/access"
        searchParams={searchParams}
      />
    </section>
  );
}

async function getActorTenantId(actor: {
  id: string;
  tenantId?: string | null;
}) {
  if (actor.tenantId) {
    return actor.tenantId;
  }

  const actorRecord = (await prisma.user.findUnique({
    where: { id: actor.id },
    select: { tenantId: true },
  } as never)) as { tenantId: string | null } | null;

  return actorRecord?.tenantId ?? null;
}

export default async function AdminAccessPage({
  searchParams,
}: AdminAccessPageProps) {
  const [currentUser, params] = await Promise.all([
    requireRole("admin"),
    searchParams,
  ]);
  const tenantId = await getActorTenantId(currentUser);

  if (!tenantId) {
    redirect("/unauthorized");
  }

  const pagination = parseServerPaginationParams(params);

  return (
    <PageShell
      description="Controle quem pode concluir login com Google e acompanhe convites emitidos."
      eyebrow="Painel administrativo"
      title="Acesso"
    >
      <Suspense fallback={<AccessAdminSkeleton />}>
        <AccessAdminPanel
          pagination={pagination}
          searchParams={params}
          tenantId={tenantId}
        />
      </Suspense>
    </PageShell>
  );
}
