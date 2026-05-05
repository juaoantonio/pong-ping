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
