import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";
import {
  allowEmail,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/access";
import { isInvitationExpiryPreset } from "@/lib/invitations";
import { createAccessInvitation } from "@/lib/contexts/invitations";
import { recordAuditEvent } from "@/lib/contexts/audit";
import {
  getPageInfo,
  getPaginationOffset,
  parseApiPaginationParams,
} from "@/lib/pagination";

type AccessRequestBody = {
  email?: unknown;
  expiresIn?: unknown;
  oneTimeUse?: unknown;
  type?: unknown;
};

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
  const { actor, response } = await requireAdmin("access_management_forbidden");

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

  const tenantWhere = { tenantId };
  const totalCount = await prisma.allowedEmail.count({ where: tenantWhere } as never);
  const pageInfo = getPageInfo(parsedPagination.pagination, totalCount);
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
          select: { email: true, name: true },
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

  return NextResponse.json({ allowedEmails, invitations, pageInfo });
}

export async function POST(request: Request) {
  const { actor, response } = await requireAdmin("access_management_forbidden");

  if (!actor) {
    return response;
  }

  const tenantId = await getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json({ error: "Sem contexto de tenant." }, { status: 403 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as AccessRequestBody | null;

  if (body?.type === "invite") {
    const expiresIn = body.expiresIn ?? "15m";

    if (!isInvitationExpiryPreset(expiresIn)) {
      return NextResponse.json(
        { error: "Informe uma validade valida para o convite." },
        { status: 400 },
      );
    }

    const oneTimeUse =
      typeof body.oneTimeUse === "boolean" ? body.oneTimeUse : true;
    const result = await createAccessInvitation(prisma, {
      actorUserId: actor.id,
      tenantId,
      expiresIn,
      oneTimeUse,
    });

    if (!result.ok) {
      throw new Error(result.error.code);
    }

    const { token, ...invitation } = result.value;

    return NextResponse.json({
      invitation: {
        ...invitation,
        usedAt: null,
        usedByEmail: null,
      },
      inviteUrl: new URL(`/invite/${token}`, request.url).toString(),
    });
  }

  if (typeof body?.email !== "string") {
    return NextResponse.json(
      { error: "Informe um email valido." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(body.email);

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Informe um email valido." },
      { status: 400 },
    );
  }

  const allowedEmail = await allowEmail(email, tenantId, actor.id);

  await recordAuditEvent(prisma, {
    tenantId,
    actorUserId: actor.id,
    action: "email_allowed",
    metadata: { email, tenantId },
  });

  return NextResponse.json({ allowedEmail });
}
