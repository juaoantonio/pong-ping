import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import {
  allowEmail,
  createInvitationToken,
  getInvitationExpiry,
  hashInvitationToken,
  isValidEmail,
  normalizeEmail,
} from "@/lib/auth/access";

type AccessRequestBody = {
  email?: unknown;
  type?: unknown;
};

async function requireAdmin(): Promise<
  | {
      actor: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
      response?: never;
    }
  | { actor: null; response: NextResponse }
> {
  const actor = await getCurrentUser();

  if (!actor) {
    return {
      actor: null,
      response: NextResponse.json(
        { error: "Nao autenticado." },
        { status: 401 },
      ),
    };
  }

  if (!canAccessAdmin(actor.role)) {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "admin_action_denied",
        metadata: {
          reason: "access_management_forbidden",
          actorRole: actor.role,
        },
      },
    });

    return {
      actor: null,
      response: NextResponse.json({ error: "Sem permissao." }, { status: 403 }),
    };
  }

  return { actor };
}

export async function GET() {
  const { actor, response } = await requireAdmin();

  if (!actor) {
    return response;
  }

  const [allowedEmails, invitations] = await Promise.all([
    prisma.allowedEmail.findMany({
      orderBy: { createdAt: "desc" },
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
        usedAt: true,
        usedByEmail: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ allowedEmails, invitations });
}

export async function POST(request: Request) {
  const { actor, response } = await requireAdmin();

  if (!actor) {
    return response;
  }

  const body = (await request
    .json()
    .catch(() => null)) as AccessRequestBody | null;

  if (body?.type === "invite") {
    const token = createInvitationToken();
    const invitation = await prisma.authInvitation.create({
      data: {
        tokenHash: hashInvitationToken(token),
        expiresAt: getInvitationExpiry(),
        createdByUserId: actor.id,
      },
      select: {
        id: true,
        expiresAt: true,
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
