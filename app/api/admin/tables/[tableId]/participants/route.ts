import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureTableMembership } from "@/lib/tables/service";
import { requireAdmin } from "@/app/api/admin/_shared";

type AddParticipantBody = {
  userId?: unknown;
};

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "add_table_participant_forbidden",
  );

  if (!actor) {
    return response;
  }

  const { tableId } = await context.params;
  const body = (await request
    .json()
    .catch(() => null)) as AddParticipantBody | null;
  const userId = typeof body?.userId === "string" ? body.userId : null;

  if (!userId) {
    return NextResponse.json(
      { error: "Selecione um usuario." },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await ensureTableMembership(tx, tableId, userId);

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: userId,
          action: "table_member_added",
          metadata: { tableId },
        },
      });
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (error.message === "table_not_found") {
      return NextResponse.json(
        { error: "Mesa nao encontrada." },
        { status: 404 },
      );
    }

    if (error.message === "user_not_found") {
      return NextResponse.json(
        { error: "Usuario nao encontrado." },
        { status: 400 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
