import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import {
  finishMatch,
  mapCompetitionErrorToHttp,
} from "@/lib/contexts/competition";
import { prisma } from "@/lib/prisma";
import { getActorTenantId } from "@/lib/tables/tenant";

type FinishMatchBody = {
  winnerParticipantId?: unknown;
};

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const tenantId = getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json(
      { error: "Contexto de tenant ausente." },
      { status: 403 },
    );
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

  const result = await prisma.$transaction((tx) =>
    finishMatch(tx, {
      tenantId,
      tableId,
      winnerParticipantId,
      actorUserId: actor.id,
      actorCanManageTable: canAccessAdmin(actor.role),
    }),
  );

  if (!result.ok) {
    const { body, status } = mapCompetitionErrorToHttp(result.error);

    return NextResponse.json(body, { status });
  }

  return NextResponse.json({ match: result.value });
}
