import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { AccessAdmin } from "@/app/admin/access/access-admin";
import { CardTableSkeleton } from "@/components/page-skeletons";
import { PaginationControls } from "@/components/pagination-controls";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const totalCount = await prisma.allowedEmail.count({ where: tenantWhere } as never);
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
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de acesso</CardTitle>
        <CardDescription>
          Autorize emails e crie convites de login com validade curta.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
      </CardContent>
    </Card>
  );
}

async function getActorTenantId(actor: { id: string; tenantId?: string | null }) {
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
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Acesso</h1>
      </div>

      <Suspense fallback={<CardTableSkeleton rows={5} />}>
        <AccessAdminPanel
          pagination={pagination}
          searchParams={params}
          tenantId={tenantId}
        />
      </Suspense>
    </div>
  );
}
