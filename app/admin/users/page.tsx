import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { CardTableSkeleton } from "@/components/page-skeletons";
import { PaginationControls } from "@/components/pagination-controls";
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
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de usuarios</CardTitle>
        <CardDescription>
          Admins visualizam apenas users. Superadmins visualizam todos e podem
          alterar roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
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
          itemLabel="usuarios"
          pageInfo={pageInfo}
          pathname="/admin/users"
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
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
      </div>

      <Suspense fallback={<CardTableSkeleton rows={6} />}>
        <UsersAdminPanel
          currentUser={currentUser}
          pagination={pagination}
          searchParams={params}
          tenantId={tenantId}
        />
      </Suspense>
    </div>
  );
}
