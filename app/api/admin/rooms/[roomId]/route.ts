import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { deny } from "@/app/api/admin/rooms/route";

type RouteContext = {
  params: Promise<{
    roomId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "delete_room_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
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
