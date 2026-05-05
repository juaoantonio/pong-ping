import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  enqueueUserInTable,
  removeUserFromTableQueue,
  type TablePlayError,
} from "@/lib/contexts/table-play";
import { recordAuditEvent } from "@/lib/contexts/audit";

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

  if (error.code === "user_not_in_table") {
    return NextResponse.json(
      { error: "Entre na mesa antes de entrar na fila." },
      { status: 403 },
    );
  }

  if (error.code === "user_already_queued") {
    return NextResponse.json(
      { error: "Voce ja esta na fila desta mesa." },
      { status: 400 },
    );
  }

  if (error.code === "user_not_queued") {
    return NextResponse.json(
      { error: "Voce nao esta na fila desta mesa." },
      { status: 400 },
    );
  }

  if (error.code === "current_player_cannot_leave_queue") {
    return NextResponse.json(
      { error: "Jogadores da rodada atual nao podem sair da fila." },
      { status: 400 },
    );
  }

  throw new Error(error.code);
}

export async function POST(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { tableId } = await context.params;

  const result = await prisma.$transaction(async (tx) => {
    const queueResult = await enqueueUserInTable(tx, tableId, actor.id);

    if (!queueResult.ok) {
      return queueResult;
    }

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      targetUserId: actor.id,
      action: "table_queue_joined",
      metadata: { tableId },
    });

    return queueResult;
  });

  if (!result.ok) {
    return tablePlayErrorResponse(result.error);
  }

  return NextResponse.json({ ok: true, participant: result.value });
}

export async function DELETE(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { tableId } = await context.params;

  const result = await prisma.$transaction(async (tx) => {
    const removeResult = await removeUserFromTableQueue(tx, tableId, actor.id);

    if (!removeResult.ok) {
      return removeResult;
    }

    await recordAuditEvent(tx, {
      actorUserId: actor.id,
      targetUserId: actor.id,
      action: "table_queue_left",
      metadata: { tableId, participantId: removeResult.value.id },
    });

    return removeResult;
  });

  if (!result.ok) {
    return tablePlayErrorResponse(result.error);
  }

  return NextResponse.json({ ok: true });
}
