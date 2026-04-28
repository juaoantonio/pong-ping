import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import { finishRoomMatch } from "@/lib/rooms/service";

type FinishMatchBody = {
  winnerParticipantId?: unknown;
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
    await deny(actor.id, "finish_room_match_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { roomId } = await context.params;
  const body = (await request.json().catch(() => null)) as FinishMatchBody | null;
  const winnerParticipantId =
    typeof body?.winnerParticipantId === "string" ? body.winnerParticipantId : null;

  if (!winnerParticipantId) {
    return NextResponse.json({ error: "Selecione o vencedor da rodada." }, { status: 400 });
  }

  try {
    const match = await prisma.$transaction((tx) =>
      finishRoomMatch(tx, roomId, winnerParticipantId, actor.id),
    );

    return NextResponse.json({ match });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "room_not_found") {
      return NextResponse.json({ error: "Sala nao encontrada." }, { status: 404 });
    }

    if (error.message === "not_enough_players") {
      return NextResponse.json({ error: "A fila precisa de pelo menos dois jogadores." }, { status: 400 });
    }

    if (error.message === "winner_not_in_current_match") {
      return NextResponse.json({ error: "O vencedor precisa estar na mesa atual." }, { status: 400 });
    }

    throw error;
  }
}
