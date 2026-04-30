import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";

type CreateTableBody = {
  name?: unknown;
};

export async function POST(request: Request) {
  const { actor, response } = await requireAdmin("create_table_forbidden");

  if (!actor) {
    return response;
  }

  const body = (await request
    .json()
    .catch(() => null)) as CreateTableBody | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Informe o nome da mesa." },
      { status: 400 },
    );
  }

  const table = await prisma.$transaction(async (tx) => {
    const createdTable = await tx.pingPongTable.create({
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
        action: "table_created",
        metadata: {
          tableId: createdTable.id,
          tableName: createdTable.name,
        },
      },
    });

    return createdTable;
  });

  return NextResponse.json({ table });
}
