import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";
import {
  allowEmail,
  createInvitationToken,
  hashInvitationToken,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/access";
import {
  getInvitationExpiry,
  isInvitationExpiryPreset,
} from "@/lib/invitations";
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

export async function GET(request: Request) {
  const { actor, response } = await requireAdmin("access_management_forbidden");

  if (!actor) {
    return response;
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

  const totalCount = await prisma.allowedEmail.count();
  const pageInfo = getPageInfo(parsedPagination.pagination, totalCount);
  const [allowedEmails, invitations] = await Promise.all([
    prisma.allowedEmail.findMany({
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

    const token = createInvitationToken();
    const oneTimeUse =
      typeof body.oneTimeUse === "boolean" ? body.oneTimeUse : true;
    const invitation = await prisma.authInvitation.create({
      data: {
        tokenHash: hashInvitationToken(token),
        expiresAt: getInvitationExpiry(expiresIn),
        oneTimeUse,
        createdByUserId: actor.id,
      },
      select: {
        id: true,
        expiresAt: true,
        oneTimeUse: true,
        createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "invitation_created",
        metadata: {
          invitationId: invitation.id,
          expiresAt: invitation.expiresAt,
          oneTimeUse: invitation.oneTimeUse,
        },
      },
    });

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

  const allowedEmail = await allowEmail(email, actor.id);

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "email_allowed",
      metadata: { email },
    },
  });

  return NextResponse.json({ allowedEmail });
}
