import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/contexts/audit";
import {
  removeUserFromCurrentRound,
  type TablePlayError,
} from "@/lib/contexts/table-play";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getActorTenantId } from "@/lib/tables/tenant";

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

function tablePlayErrorResponse(error: TablePlayError) {
  if (error.code === "table_not_found") {
    return NextResponse.json(
      { error: "Mesa nao encontrada." },
      { status: 404 },
    );
  }

  if (error.code === "user_not_in_current_match") {
    return NextResponse.json(
      { error: "Voce nao esta na rodada atual." },
      { status: 400 },
    );
  }

  if (error.code === "participant_not_found") {
    return NextResponse.json(
      { error: "Participante nao encontrado." },
      { status: 404 },
    );
  }

  throw new Error(error.code);
}

export async function DELETE(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const tenantId = getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json(
      { error: "Contexto de tenant ausente." },
      { status: 403 },
    );
  }

  const { tableId } = await context.params;

  const result = await prisma.$transaction(async (tx) => {
    const removeResult = await removeUserFromCurrentRound(
      tx,
      tableId,
      actor.id,
      tenantId,
    );

    if (!removeResult.ok) {
      return removeResult;
    }

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      targetUserId: actor.id,
      action: "table_current_round_left",
      metadata: { tableId, participantId: removeResult.value.id },
    });

    return removeResult;
  });

  if (!result.ok) {
    return tablePlayErrorResponse(result.error);
  }

  return NextResponse.json({ ok: true });
}
