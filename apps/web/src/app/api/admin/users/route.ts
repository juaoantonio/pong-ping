import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireAdmin } from "@/app/api/admin/_shared";
import {
  getPageInfo,
  getPaginationOffset,
  parseApiPaginationParams,
} from "@/lib/pagination";

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

export async function GET(request: Request) {
  const { actor, response } = await requireAdmin("list_users_forbidden");

  if (!actor) {
    return response;
  }

  const tenantId = await getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json({ error: "Sem contexto de tenant." }, { status: 403 });
  }

  const parsedPagination = parseApiPaginationParams(
    new URL(request.url).searchParams,
  );

  if (!parsedPagination.ok) {
    return NextResponse.json(
      { error: parsedPagination.error },
      { status: 400 },
    );
  }

  const where = {
    tenantId,
    ...(isSuperAdmin(actor) ? {} : { role: "user" }),
  } as Prisma.UserWhereInput;
  const totalCount = await prisma.user.count({ where });
  const pageInfo = getPageInfo(parsedPagination.pagination, totalCount);
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

  return NextResponse.json({
    pageInfo,
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
      role: user.role,
      createdAt: user.createdAt,
    })),
  });
}
