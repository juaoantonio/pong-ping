import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, type Role } from "@/lib/auth/roles";
import type { ClientAuthenticatedUser } from "@/lib/auth/shared";

export type AuthenticatedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export const getCurrentUser = cache(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
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
});

export function toClientAuthenticatedUser(
  user: Pick<
    AuthenticatedUser,
    "id" | "name" | "email" | "avatarUrl" | "image" | "role"
  >,
): ClientAuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? user.image,
    role: user.role,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(requiredRole: Role) {
  const user = await requireAuth();

  if (!hasRole(user.role, requiredRole)) {
    redirect("/unauthorized");
  }

  return user;
}
