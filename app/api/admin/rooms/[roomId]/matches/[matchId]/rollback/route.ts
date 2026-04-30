import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rollbackRoomMatch } from "@/lib/rooms/service";
import {
  getRollbackErrorResponse,
  requireAdmin,
} from "@/app/api/admin/_shared";

type RouteContext = {
  params: Promise<{
    roomId: string;
    matchId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin("rollback_room_match_forbidden");

  if (!actor) {
    return response;
  }

  const { roomId, matchId } = await context.params;

  try {
    const rollback = await prisma.$transaction((tx) =>
      rollbackRoomMatch(tx, roomId, matchId, actor.id),
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
