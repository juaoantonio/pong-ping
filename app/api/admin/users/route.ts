import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdmin, isSuperAdmin } from "@/lib/auth/roles";

export async function GET() {
  const actor = await getCurrentUser();

  if (!actor) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  if (!canAccessAdmin(actor.role)) {
    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "admin_action_denied",
        metadata: {
          reason: "list_users_forbidden",
          actorRole: actor.role,
        },
      },
    });

    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: isSuperAdmin(actor) ? undefined : { role: "user" },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
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

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? user.image,
      role: user.role,
      createdAt: user.createdAt,
    })),
  });
}
