import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin } from "@/lib/auth/roles";

type CreateRoomBody = {
  name?: unknown;
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

export async function POST(request: Request) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, "create_room_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreateRoomBody | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Informe o nome da sala." }, { status: 400 });
  }

  const room = await prisma.$transaction(async (tx) => {
    const createdRoom = await tx.pingPongRoom.create({
      data: {
        name,
        createdById: actor.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "room_created",
        metadata: {
          roomId: createdRoom.id,
          roomName: createdRoom.name,
        },
      },
    });

    return createdRoom;
  });

  return NextResponse.json({ room });
}
