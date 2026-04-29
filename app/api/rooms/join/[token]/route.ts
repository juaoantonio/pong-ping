import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { addUserToRoom } from "@/lib/rooms/service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { token } = await context.params;

  const invitation = await prisma.pingPongRoomInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      roomId: true,
      expiresAt: true,
      oneTimeUse: true,
      usedAt: true,
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Convite de sala invalido." },
      { status: 404 },
    );
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Este convite de sala expirou." },
      { status: 400 },
    );
  }

  if (invitation.oneTimeUse && invitation.usedAt) {
    return NextResponse.json(
      { error: "Este convite de sala ja foi utilizado." },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await addUserToRoom(tx, invitation.roomId, actor.id);
      const usedAt = new Date();

      const claimed = await tx.pingPongRoomInvitation.updateMany({
        where: {
          id: invitation.id,
          expiresAt: { gt: usedAt },
          ...(invitation.oneTimeUse ? { usedAt: null } : {}),
        },
        data: {
          usedAt,
          usedByUserId: actor.id,
        },
      });

      if (claimed.count === 0) {
        throw new Error("invitation_unavailable");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "room_joined_via_invitation",
          metadata: {
            roomId: invitation.roomId,
            invitationId: invitation.id,
            oneTimeUse: invitation.oneTimeUse,
          },
        },
      });
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "user_already_joined") {
      return NextResponse.json(
        { error: "Voce ja entrou nesta sala." },
        { status: 400 },
      );
    }

    if (error.message === "room_not_found") {
      return NextResponse.json(
        { error: "Sala nao encontrada." },
        { status: 404 },
      );
    }

    if (error.message === "invitation_unavailable") {
      return NextResponse.json(
        { error: "Convite de sala invalido, expirado ou ja utilizado." },
        { status: 400 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
