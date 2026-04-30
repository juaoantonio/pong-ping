import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";

type CreateRoomBody = {
  name?: unknown;
};

export async function POST(request: Request) {
  const { actor, response } = await requireAdmin("create_room_forbidden");

  if (!actor) {
    return response;
  }

  const body = (await request
    .json()
    .catch(() => null)) as CreateRoomBody | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome da sala." },
      { status: 400 },
    );
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
