import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ensureTableMembership } from "@/lib/tables/service";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { token } = await context.params;

  const invitation = await prisma.pingPongTableInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      tableId: true,
      expiresAt: true,
      oneTimeUse: true,
      usedAt: true,
    },
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Convite de mesa invalido." },
      { status: 404 },
    );
  }

  if (invitation.expiresAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "Este convite de mesa expirou." },
      { status: 400 },
    );
  }

  if (invitation.oneTimeUse && invitation.usedAt) {
    return NextResponse.json(
      { error: "Este convite de mesa ja foi utilizado." },
      { status: 400 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await ensureTableMembership(tx, invitation.tableId, actor.id);
      const usedAt = new Date();

      const claimed = await tx.pingPongTableInvitation.updateMany({
        where: {
          id: invitation.id,
          expiresAt: { gt: usedAt },
          ...(invitation.oneTimeUse ? { usedAt: null } : {}),
        },
        data: {
          usedAt,
          usedByUserId: actor.id,
        },
      });

      if (claimed.count === 0) {
        throw new Error("invitation_unavailable");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "table_joined_via_invitation",
          metadata: {
            tableId: invitation.tableId,
            invitationId: invitation.id,
            oneTimeUse: invitation.oneTimeUse,
          },
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

    if (error.message === "invitation_unavailable") {
      return NextResponse.json(
        { error: "Convite de mesa invalido, expirado ou ja utilizado." },
        { status: 400 },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true, tableId: invitation.tableId });
}
