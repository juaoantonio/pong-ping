import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { removeParticipantFromRoom } from "@/lib/rooms/service";
import { requireAdmin } from "@/app/api/admin/_shared";

type RouteContext = {
  params: Promise<{
    roomId: string;
    participantId: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "remove_room_participant_forbidden",
  );

  if (!actor) {
    return response;
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
      return NextResponse.json(
        { error: "Participante nao encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
