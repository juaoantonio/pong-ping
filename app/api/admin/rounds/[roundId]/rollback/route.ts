import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { rollbackRoomMatch } from "@/lib/rooms/service";
import { deny } from "@/app/api/admin/rooms/route";

type RouteContext = {
  params: Promise<{
    roundId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!isSuperAdmin(actor)) {
    await deny(actor.id, "rollback_round_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { roundId } = await context.params;
  const round = await prisma.matchHistory.findUnique({
    where: { id: roundId },
    select: { roomId: true },
  });

  if (!round) {
    return NextResponse.json(
      { error: "Rodada nao encontrada." },
      { status: 404 },
    );
  }

  if (!round.roomId) {
    return NextResponse.json(
      { error: "Rodada sem room id nao pode ser revertida por esta tela." },
      { status: 409 },
    );
  }

  try {
    const rollback = await prisma.$transaction((tx) =>
      rollbackRoomMatch(tx, round.roomId!, roundId, actor.id),
    );

    return NextResponse.json({ rollback });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "match_not_found") {
      return NextResponse.json(
        { error: "Rodada nao encontrada." },
        { status: 404 },
      );
    }

    if (error.message === "cannot_rollback_rollback") {
      return NextResponse.json(
        { error: "Um rollback nao pode ser revertido." },
        { status: 400 },
      );
    }

    if (error.message === "match_already_rolled_back") {
      return NextResponse.json(
        { error: "Esta rodada ja foi revertida." },
        { status: 409 },
      );
    }

    if (error.message === "ranking_not_found") {
      return NextResponse.json(
        { error: "Ranking da rodada nao encontrado." },
        { status: 409 },
      );
    }

    throw error;
  }
}
