import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function deny(actorUserId: string | null, reason: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "admin_action_denied",
      metadata: { reason },
    },
  });
}

export async function denyTarget(
  actorUserId: string | null,
  targetUserId: string | null,
  reason: string,
) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId,
      action: "admin_action_denied",
      metadata: { reason },
    },
  });
}

export async function requireAdmin(reason: string): Promise<
  | {
      actor: CurrentUser;
      response?: never;
    }
  | { actor: null; response: NextResponse }
> {
  const actor = await getCurrentUser();

  if (!actor) {
    return {
      actor: null,
      response: NextResponse.json(
        { error: "Nao autenticado." },
        { status: 401 },
      ),
    };
  }

  if (!canAccessAdmin(actor.role)) {
    await deny(actor.id, reason);
    return {
      actor: null,
      response: NextResponse.json({ error: "Sem permissao." }, { status: 403 }),
    };
  }

  return { actor };
}

export function getRollbackErrorResponse(error: unknown) {
  if (!(error instanceof Error)) {
    throw error;
  }

  if (error.message === "match_not_found") {
    return NextResponse.json(
      { error: "Rodada nao encontrada." },
      { status: 404 },
    );
  }

  if (error.message === "cannot_rollback_rollback") {
    return NextResponse.json(
      { error: "Um rollback nao pode ser revertido." },
      { status: 400 },
    );
  }

  if (error.message === "match_already_rolled_back") {
    return NextResponse.json(
      { error: "Esta rodada ja foi revertida." },
      { status: 409 },
    );
  }

  if (error.message === "ranking_not_found") {
    return NextResponse.json(
      { error: "Ranking da rodada nao encontrado." },
      { status: 409 },
    );
  }

  return null;
}
