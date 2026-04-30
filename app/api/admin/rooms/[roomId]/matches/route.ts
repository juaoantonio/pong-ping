import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { finishRoomMatch } from "@/lib/rooms/service";
import { requireAdmin } from "@/app/api/admin/_shared";

type FinishMatchBody = {
  winnerParticipantId?: unknown;
};

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin("finish_room_match_forbidden");

  if (!actor) {
    return response;
  }

  const { roomId } = await context.params;
  const body = (await request
    .json()
    .catch(() => null)) as FinishMatchBody | null;
  const winnerParticipantId =
    typeof body?.winnerParticipantId === "string"
      ? body.winnerParticipantId
      : null;

  if (!winnerParticipantId) {
    return NextResponse.json(
      { error: "Selecione o vencedor da rodada." },
      { status: 400 },
    );
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
      return NextResponse.json(
        { error: "Sala nao encontrada." },
        { status: 404 },
      );
    }

    if (error.message === "not_enough_players") {
      return NextResponse.json(
        { error: "A fila precisa de pelo menos dois jogadores." },
        { status: 400 },
      );
    }

    if (error.message === "winner_not_in_current_match") {
      return NextResponse.json(
        { error: "O vencedor precisa estar na mesa atual." },
        { status: 400 },
      );
    }

    throw error;
  }
}
