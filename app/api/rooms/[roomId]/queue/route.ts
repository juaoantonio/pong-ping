import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  enqueueUserInRoom,
  removeUserFromRoomQueue,
} from "@/lib/rooms/service";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { roomId } = await context.params;

  try {
    const participant = await prisma.$transaction(async (tx) => {
      const queuedParticipant = await enqueueUserInRoom(tx, roomId, actor.id);

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: actor.id,
          action: "room_queue_joined",
          metadata: { roomId },
        },
      });

      return queuedParticipant;
    });

    return NextResponse.json({ ok: true, participant });
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

    if (error.message === "user_not_in_room") {
      return NextResponse.json(
        { error: "Entre na sala antes de entrar na fila." },
        { status: 403 },
      );
    }

    if (error.message === "user_already_queued") {
      return NextResponse.json(
        { error: "Voce ja esta na fila desta sala." },
        { status: 400 },
      );
    }

    throw error;
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { roomId } = await context.params;

  try {
    await prisma.$transaction(async (tx) => {
      const participant = await removeUserFromRoomQueue(tx, roomId, actor.id);

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: actor.id,
          action: "room_queue_left",
          metadata: { roomId, participantId: participant.id },
        },
      });
    });

    return NextResponse.json({ ok: true });
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

    if (error.message === "user_not_queued") {
      return NextResponse.json(
        { error: "Voce nao esta na fila desta sala." },
        { status: 400 },
      );
    }

    if (error.message === "current_player_cannot_leave_queue") {
      return NextResponse.json(
        { error: "Jogadores da rodada atual nao podem sair da fila." },
        { status: 400 },
      );
    }

    throw error;
  }
}
