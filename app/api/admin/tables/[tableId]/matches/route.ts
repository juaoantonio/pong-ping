import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";
import {
  finishMatch,
  mapCompetitionErrorToHttp,
} from "@/lib/contexts/competition";

type FinishMatchBody = {
  winnerParticipantId?: unknown;
};

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "finish_table_match_forbidden",
  );

  if (!actor) {
    return response;
  }

  if (!actor.tenantId) {
    return NextResponse.json({ error: "Sem tenant." }, { status: 403 });
  }

  const { tableId } = await context.params;
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
    const result = await prisma.$transaction((tx) =>
      finishMatch(tx, {
        tenantId: actor.tenantId!,
        tableId,
        winnerParticipantId,
        actorUserId: actor.id,
      }),
    );

    if (!result.ok) {
      const { body, status } = mapCompetitionErrorToHttp(result.error);

      return NextResponse.json(body, { status });
    }

    return NextResponse.json({ match: result.value });
  } catch (error) {
    throw error;
  }
}
