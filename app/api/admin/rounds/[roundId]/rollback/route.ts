import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { deny } from "@/app/api/admin/_shared";
import {
  mapCompetitionErrorToHttp,
  rollbackMatch,
} from "@/lib/contexts/competition";

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
    select: { tableId: true },
  });

  if (!round) {
    return NextResponse.json(
      { error: "Rodada nao encontrada." },
      { status: 404 },
    );
  }

  if (!round.tableId) {
    return NextResponse.json(
      { error: "Rodada sem table id nao pode ser revertida por esta tela." },
      { status: 409 },
    );
  }

  try {
    const result = await prisma.$transaction((tx) =>
      rollbackMatch(tx, {
        tableId: round.tableId!,
        matchHistoryId: roundId,
        actorUserId: actor.id,
      }),
    );

    if (!result.ok) {
      const { body, status } = mapCompetitionErrorToHttp(result.error);

      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ rollback: result.value });
  } catch (error) {
    throw error;
  }
}
