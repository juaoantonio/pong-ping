import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addUserToRoom } from "@/lib/rooms/service";
import { requireAdmin } from "@/app/api/admin/_shared";

type AddParticipantBody = {
  userId?: unknown;
};

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "add_room_participant_forbidden",
  );

  if (!actor) {
    return response;
  }

  const { roomId } = await context.params;
  const body = (await request
    .json()
    .catch(() => null)) as AddParticipantBody | null;
  const userId = typeof body?.userId === "string" ? body.userId : null;

  if (!userId) {
    return NextResponse.json(
      { error: "Selecione um usuario." },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await addUserToRoom(tx, roomId, userId);

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: userId,
          action: "room_participant_added",
          metadata: { roomId },
        },
      });
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "room_not_found") {
      return NextResponse.json(
        { error: "Sala nao encontrada." },
        { status: 404 },
      );
    }

    if (error.message === "user_not_found") {
      return NextResponse.json(
        { error: "Usuario nao encontrado." },
        { status: 400 },
      );
    }

    if (error.message === "user_already_joined") {
      return NextResponse.json(
        { error: "Este usuario ja esta na sala." },
        { status: 400 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
