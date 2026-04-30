import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin("delete_room_forbidden");

  if (!actor) {
    return response;
  }

  const { roomId } = await context.params;

  await prisma.$transaction(async (tx) => {
    await tx.pingPongRoom.update({
      where: { id: roomId },
      data: {
        deletedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ message: "Sala deletada com sucesso." });
}
