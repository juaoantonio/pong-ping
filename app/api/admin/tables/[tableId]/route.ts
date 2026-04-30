import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin("delete_table_forbidden");

  if (!actor) {
    return response;
  }

  const { tableId } = await context.params;

  await prisma.$transaction(async (tx) => {
    await tx.pingPongTable.update({
      where: { id: tableId },
      data: {
        deletedAt: new Date(),
      },
    });
  });

  return NextResponse.json({ message: "Mesa deletada com sucesso." });
}
