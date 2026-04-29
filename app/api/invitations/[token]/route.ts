import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashInvitationToken,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/access";

type RouteParams = {
  params: Promise<{
    token: string;
  }>;
};

type InvitationRequestBody = {
  email?: unknown;
};

export async function POST(request: Request, context: RouteParams) {
  const { token } = await context.params;
  const body = (await request
    .json()
    .catch(() => null)) as InvitationRequestBody | null;

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

  const tokenHash = hashInvitationToken(token);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const invitation = await tx.authInvitation.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        createdByUserId: true,
        expiresAt: true,
        oneTimeUse: true,
      },
    });

    if (!invitation || invitation.expiresAt <= now) {
      return null;
    }

    const claimed = await tx.authInvitation.updateMany({
      where: {
        tokenHash,
        expiresAt: { gt: now },
        ...(invitation.oneTimeUse ? { usedAt: null } : {}),
      },
      data: {
        usedAt: now,
        usedByEmail: email,
      },
    });

    if (claimed.count === 0) {
      return null;
    }

    const allowedEmail = await tx.allowedEmail.upsert({
      where: { email },
      create: {
        email,
        createdByUserId: invitation.createdByUserId,
      },
      update: {},
    });

    await tx.auditLog.create({
      data: {
        actorUserId: invitation.createdByUserId,
        action: "invitation_used",
        metadata: {
          invitationId: invitation.id,
          email,
          oneTimeUse: invitation.oneTimeUse,
        },
      },
    });

    return allowedEmail;
  });

  if (!result) {
    return NextResponse.json(
      { error: "Convite invalido, expirado ou ja utilizado." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, email });
}
