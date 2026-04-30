import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getInvitationExpiry,
  isInvitationExpiryPreset,
} from "@/lib/invitations";
import { createTableInvitationToken } from "@/lib/tables/invitations";
import { requireAdmin } from "@/app/api/admin/_shared";

type TableInvitationRequestBody = {
  expiresIn?: unknown;
  oneTimeUse?: unknown;
};

type RouteContext = {
  params: Promise<{
    tableId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { actor, response } = await requireAdmin(
    "create_table_invite_forbidden",
  );

  if (!actor) {
    return response;
  }

  const { tableId } = await context.params;
  const table = await prisma.pingPongTable.findUnique({
    where: { id: tableId },
    select: { id: true },
  });

  if (!table) {
    return NextResponse.json(
      { error: "Mesa nao encontrada." },
      { status: 404 },
    );
  }

  const body = (await request
    .json()
    .catch(() => null)) as TableInvitationRequestBody | null;
  const expiresIn = body?.expiresIn ?? "7d";

  if (!isInvitationExpiryPreset(expiresIn)) {
    return NextResponse.json(
      { error: "Informe uma validade valida para o convite." },
      { status: 400 },
    );
  }

  const oneTimeUse =
    typeof body?.oneTimeUse === "boolean" ? body.oneTimeUse : false;
  const token = createTableInvitationToken();
  const expiresAt = getInvitationExpiry(expiresIn);

  const invite = await prisma.$transaction(async (tx) => {
    const createdInvite = await tx.pingPongTableInvitation.create({
      data: {
        tableId,
        token,
        createdById: actor.id,
        expiresAt,
        oneTimeUse,
      },
      select: {
        id: true,
        expiresAt: true,
        oneTimeUse: true,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "table_invitation_created",
        metadata: {
          tableId,
          invitationId: createdInvite.id,
          expiresAt: createdInvite.expiresAt.toISOString(),
          oneTimeUse: createdInvite.oneTimeUse,
        },
      },
    });

    return createdInvite;
  });

  return NextResponse.json({
    invite: {
      ...invite,
      token,
    },
  });
}
