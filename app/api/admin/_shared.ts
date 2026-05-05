import { NextResponse } from "next/server";
import { canAccessAdmin } from "@/lib/auth/roles";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAdminDenied } from "@/lib/contexts/audit";
import { prisma } from "@/lib/prisma";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
export type AdminActor = CurrentUser & { tenantId?: string | null };

export async function getKnownTenantIdForActor(actor: AdminActor) {
  if (actor.tenantId) {
    return actor.tenantId;
  }

  const user = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { tenantId: true },
  });

  return user?.tenantId ?? null;
}

async function getTenantIdForActorId(actorUserId: string | null) {
  if (!actorUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { tenantId: true },
  });

  return user?.tenantId ?? null;
}

export async function deny(
  actorUserId: string | null,
  reason: string,
  tenantId?: string | null,
) {
  await recordAdminDenied(prisma, {
    actorUserId,
    reason,
    tenantId: tenantId ?? (await getTenantIdForActorId(actorUserId)),
  });
}

export async function denyTarget(
  actorUserId: string | null,
  targetUserId: string | null,
  reason: string,
  tenantId?: string | null,
) {
  await recordAdminDenied(prisma, {
    actorUserId,
    targetUserId,
    reason,
    tenantId: tenantId ?? (await getTenantIdForActorId(actorUserId)),
  });
}

export async function requireAdmin(reason: string): Promise<
  | {
      actor: AdminActor;
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
    await deny(actor.id, reason, await getKnownTenantIdForActor(actor));
    return {
      actor: null,
      response: NextResponse.json({ error: "Sem permissao." }, { status: 403 }),
    };
  }

  return {
    actor: {
      ...actor,
      tenantId: await getKnownTenantIdForActor(actor),
    },
  };
}
