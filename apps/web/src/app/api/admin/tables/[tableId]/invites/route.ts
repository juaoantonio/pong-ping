import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isInvitationExpiryPreset } from "@/lib/invitations";
import { requireAdmin } from "@/app/api/admin/_shared";
import { createTableInvitation } from "@/lib/contexts/invitations";
import { getActorTenantId } from "@/lib/tables/tenant";

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

  const tenantId = getActorTenantId(actor);

  if (!tenantId) {
    return NextResponse.json(
      { error: "Contexto de tenant ausente." },
      { status: 403 },
    );
  }

  const { tableId } = await context.params;
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
  const result = await createTableInvitation(prisma, {
    actorUserId: actor.id,
    expiresIn,
    oneTimeUse,
    tableId,
    tenantId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Mesa nao encontrada." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    invite: result.value,
  });
}
