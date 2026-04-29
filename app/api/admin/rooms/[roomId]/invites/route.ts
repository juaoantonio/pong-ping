import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import {
  getInvitationExpiry,
  isInvitationExpiryPreset,
} from "@/lib/invitations";
import { createRoomInvitationToken } from "@/lib/rooms/invitations";

type RoomInvitationRequestBody = {
  expiresIn?: unknown;
  oneTimeUse?: unknown;
};

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

async function deny(actorUserId: string | null, reason: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "admin_action_denied",
      metadata: { reason },
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "create_room_invite_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { roomId } = await context.params;
  const room = await prisma.pingPongRoom.findUnique({
    where: { id: roomId },
    select: { id: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });
  }

  const body = (await request
    .json()
    .catch(() => null)) as RoomInvitationRequestBody | null;
  const expiresIn = body?.expiresIn ?? "7d";

  if (!isInvitationExpiryPreset(expiresIn)) {
    return NextResponse.json(
      { error: "Informe uma validade valida para o convite." },
      { status: 400 },
    );
  }

  const oneTimeUse =
    typeof body?.oneTimeUse === "boolean" ? body.oneTimeUse : false;
  const token = createRoomInvitationToken();
  const expiresAt = getInvitationExpiry(expiresIn);

  const invite = await prisma.$transaction(async (tx) => {
    const createdInvite = await tx.pingPongRoomInvitation.create({
      data: {
        roomId,
        token,
        createdById: actor.id,
        expiresAt,
        oneTimeUse,
      },
      select: {
        id: true,
        expiresAt: true,
        oneTimeUse: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "room_invitation_created",
        metadata: {
          roomId,
          invitationId: createdInvite.id,
          expiresAt: createdInvite.expiresAt.toISOString(),
          oneTimeUse: createdInvite.oneTimeUse,
        },
      },
    });

    return createdInvite;
  });

  return NextResponse.json({
    invite: {
      ...invite,
      token,
    },
  });
}
