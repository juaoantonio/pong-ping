import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canChangeRole, isRole } from "@/lib/auth/roles";

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

export async function PATCH(request: Request, context: RouteParams) {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { role?: unknown } | null;

  if (!canChangeRole(actor.role)) {
    await denied(actor.id, id, "change_role_forbidden");
    return NextResponse.json({ error: "Sem permissao para alterar roles." }, { status: 403 });
  }

  if (!isRole(body?.role)) {
    await denied(actor.id, id, "invalid_role");
    return NextResponse.json({ error: "Role invalida." }, { status: 400 });
  }

  const nextRole = body.role;

  if (actor.id === id) {
    await denied(actor.id, id, "self_role_change");
    return NextResponse.json({ error: "Voce nao pode alterar sua propria role." }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true },
      });

      if (!target) {
        return null;
      }

      if (target.role === "superadmin" && nextRole !== "superadmin") {
        const superAdminCount = await tx.user.count({ where: { role: "superadmin" } });

        if (superAdminCount <= 1) {
          throw new Error("last_superadmin_role_change");
        }
      }

      const user = await tx.user.update({
        where: { id },
        data: { role: nextRole },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          targetUserId: target.id,
          action: "role_changed",
          metadata: {
            previousRole: target.role,
            newRole: nextRole,
            targetEmail: target.email,
          },
        },
      });

      return user;
    });

    if (!updatedUser) {
      await denied(actor.id, id, "target_not_found");
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl ?? updatedUser.image,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "last_superadmin_role_change") {
      await denied(actor.id, id, "last_superadmin_role_change");
      return NextResponse.json({ error: "O ultimo superadmin nao pode ser rebaixado." }, { status: 400 });
    }

    throw error;
  }
}
