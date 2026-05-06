import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasRole, type Role } from "@/lib/auth/roles";
import type { ClientAuthenticatedUser } from "@/lib/auth/shared";

export type AuthenticatedUser = {
  id: string;
  tenantId: string | null;
  tenant: {
    slug: string;
    name: string;
  } | null;
  name: string | null;
  email: string | null;
  image: string | null;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
};

export const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      tenantId: true,
      name: true,
      email: true,
      image: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      tenant: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });

  return user
    ? {
        ...user,
        tenantId: user.tenantId ?? null,
        tenant: user.tenant ?? null,
      }
    : null;
});

export function toClientAuthenticatedUser(
  user: Pick<
    AuthenticatedUser,
    "id" | "name" | "email" | "avatarUrl" | "image" | "role"
  > & {
    tenant?: Pick<NonNullable<AuthenticatedUser["tenant"]>, "name" | "slug"> | null;
  },
): ClientAuthenticatedUser {
  return {
    id: user.id,
    tenantName: user.tenant?.name ?? null,
    tenantSlug: user.tenant?.slug ?? null,
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

export async function requireTenantUser() {
  const user = await requireAuth();

  if (!user.tenantId) {
    redirect("/unauthorized");
  }

  return user;
}

export async function requireTenantAdmin() {
  const user = await requireTenantUser();

  if (!hasRole(user.role, "admin")) {
    redirect("/unauthorized");
  }

  return user;
}
