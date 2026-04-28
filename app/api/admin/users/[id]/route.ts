import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin, canDeleteUser } from "@/lib/auth/roles";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

async function denied(actorUserId: string | null, targetUserId: string | null, reason: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      targetUserId,
      action: "admin_action_denied",
      metadata: { reason },
    },
  });
}

export async function DELETE(_request: Request, context: RouteParams) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await context.params;

  if (!canAccessAdmin(actor.role)) {
    await denied(actor.id, id, "delete_user_forbidden");
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  if (actor.id === id) {
    await denied(actor.id, id, "self_delete");
    return NextResponse.json({ error: "Voce nao pode remover sua propria conta." }, { status: 400 });
  }

  try {
    const deletedUser = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      });

      if (!target) {
        return null;
      }

      if (target.role === "superadmin") {
        const superAdminCount = await tx.user.count({ where: { role: "superadmin" } });

        if (superAdminCount <= 1) {
          throw new Error("last_superadmin_delete");
        }
      }

      if (!canDeleteUser(actor.role, target.role)) {
        throw new Error("delete_target_forbidden");
      }

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: target.id,
          action: "user_deleted",
          metadata: {
            targetEmail: target.email,
            previousRole: target.role,
          },
        },
      });

      await tx.user.delete({ where: { id } });

      return target;
    });

    if (!deletedUser) {
      await denied(actor.id, id, "target_not_found");
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "last_superadmin_delete") {
      await denied(actor.id, id, "last_superadmin_delete");
      return NextResponse.json({ error: "O ultimo superadmin nao pode ser removido." }, { status: 400 });
    }

    if (error instanceof Error && error.message === "delete_target_forbidden") {
      await denied(actor.id, id, "delete_target_forbidden");
      return NextResponse.json({ error: "Voce nao pode remover este usuario." }, { status: 403 });
    }

    throw error;
  }
}
