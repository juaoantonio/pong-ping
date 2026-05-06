import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { removeParticipantFromTable } from "@/lib/tables/service";
import { requireAdmin } from "@/app/api/admin/_shared";
import { getActorTenantId } from "@/lib/tables/tenant";

type RouteContext = {
  params: Promise<{
    tableId: string;
    participantId: string;
  }>;
};

export async function DELETE(_: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "remove_table_participant_forbidden",
  );

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

  const { tableId, participantId } = await context.params;

  try {
    await prisma.$transaction(async (tx) => {
      const participant = await tx.pingPongTableParticipant.findFirst({
        where: { id: participantId, tableId, tenantId },
        select: { userId: true },
      });

      await removeParticipantFromTable(tx, tableId, participantId, tenantId);

      await tx.auditLog.create({
        data: {
          tenantId,
          actorUserId: actor.id,
          targetUserId: participant?.userId,
          action: "table_participant_removed",
          metadata: { tableId, participantId },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "participant_not_found") {
      return NextResponse.json(
        { error: "Participante nao encontrado." },
        { status: 404 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
