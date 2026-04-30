import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { rollbackRoomMatch } from "@/lib/rooms/service";
import { deny, getRollbackErrorResponse } from "@/app/api/admin/_shared";

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
    const errorResponse = getRollbackErrorResponse(error);

    if (errorResponse) {
      return errorResponse;
    }
    throw error;
  }
}
