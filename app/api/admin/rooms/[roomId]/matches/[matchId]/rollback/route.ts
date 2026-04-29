import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";
import { rollbackRoomMatch } from "@/lib/rooms/service";

type RouteContext = {
  params: Promise<{
    roomId: string;
    matchId: string;
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

export async function POST(_request: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "rollback_room_match_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { roomId, matchId } = await context.params;

  try {
    const rollback = await prisma.$transaction((tx) =>
      rollbackRoomMatch(tx, roomId, matchId, actor.id),
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
