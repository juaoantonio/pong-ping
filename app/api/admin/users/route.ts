import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/auth/roles";
import { requireAdmin } from "@/app/api/admin/_shared";

export async function GET() {
  const { actor, response } = await requireAdmin("list_users_forbidden");

  if (!actor) {
    return response;
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
