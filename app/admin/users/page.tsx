import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { PaginationControls } from "@/components/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireRole, type AuthenticatedUser } from "@/lib/auth/session";
import {
  getPageInfo,
  getPaginationOffset,
  parseServerPaginationParams,
  type PaginationInput,
} from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function UsersAdminSkeleton() {
  return (
    <div className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-0 divide-y divide-border border-y border-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="py-3" key={index}>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}

async function UsersAdminPanel({
  currentUser,
  pagination,
  searchParams,
  tenantId,
}: {
  currentUser: AuthenticatedUser;
  pagination: PaginationInput;
  searchParams: Record<string, string | string[] | undefined>;
  tenantId: string;
}) {
  await connection();

  const where = {
    tenantId,
    ...(isSuperAdmin(currentUser) ? {} : { role: "user" }),
  } as Prisma.UserWhereInput;
  const totalCount = await prisma.user.count({ where });
  const pageInfo = getPageInfo(pagination, totalCount);
  const users = await prisma.user.findMany({
    where,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: getPaginationOffset(pageInfo),
    take: pageInfo.pageSize,
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
    <section className="grid gap-5 border-t border-border pt-5">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Gerenciamento de usuários</h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Admins visualizam apenas users. Superadmins visualizam todos e podem
          alterar roles.
        </p>
      </div>
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
      <PaginationControls
        itemLabel="usuários"
        pageInfo={pageInfo}
        pathname="/admin/users"
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

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
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
      description="Gerencie papéis, remoções e visibilidade por tenant com estado pendente por linha."
      eyebrow="Painel administrativo"
      title="Usuários"
    >
      <Suspense fallback={<UsersAdminSkeleton />}>
        <UsersAdminPanel
          currentUser={currentUser}
          pagination={pagination}
          searchParams={params}
          tenantId={tenantId}
        />
      </Suspense>
    </PageShell>
  );
}
