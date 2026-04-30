import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rollbackTableMatch } from "@/lib/tables/service";
import {
  getRollbackErrorResponse,
  requireAdmin,
} from "@/app/api/admin/_shared";

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
    const rollback = await prisma.$transaction((tx) =>
      rollbackTableMatch(tx, tableId, matchId, actor.id),
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
