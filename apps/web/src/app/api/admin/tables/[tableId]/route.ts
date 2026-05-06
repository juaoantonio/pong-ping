import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/app/api/admin/_shared";
import { getActorTenantId } from "@/lib/tables/tenant";

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

  const tenantId = getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json(
      { error: "Contexto de tenant ausente." },
      { status: 403 },
    );
  }

  const { tableId } = await context.params;

  const deleted = await prisma.$transaction(async (tx) =>
    tx.pingPongTable.updateMany({
      where: { id: tableId, tenantId, deletedAt: null },
      data: {
        deletedAt: new Date(),
      },
    }),
  );

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Mesa nao encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({ message: "Mesa deletada com sucesso." });
}
