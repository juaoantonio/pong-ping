import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";
import {
  mapCompetitionErrorToHttp,
  rollbackMatch,
} from "@/lib/contexts/competition";

type RouteContext = {
  params: Promise<{
    tableId: string;
    matchId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "rollback_table_match_forbidden",
  );

  if (!actor) {
    return response;
  }

  const { tableId, matchId } = await context.params;

  try {
    const result = await prisma.$transaction((tx) =>
      rollbackMatch(tx, { tableId, matchHistoryId: matchId, actorUserId: actor.id }),
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
