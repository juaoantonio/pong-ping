import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import { removeParticipantFromRoom } from "@/lib/rooms/service";

type RouteContext = {
  params: Promise<{
    roomId: string;
    participantId: string;
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

export async function DELETE(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "remove_room_participant_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { roomId, participantId } = await context.params;

  try {
    await prisma.$transaction(async (tx) => {
      const participant = await tx.pingPongRoomParticipant.findUnique({
        where: { id: participantId },
        select: { userId: true },
      });

      await removeParticipantFromRoom(tx, roomId, participantId);

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: participant?.userId,
          action: "room_participant_removed",
          metadata: { roomId, participantId },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "participant_not_found") {
      return NextResponse.json({ error: "Participante nao encontrado." }, { status: 404 });
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
