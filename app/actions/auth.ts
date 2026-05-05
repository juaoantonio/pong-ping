"use server";

import { signIn, signOut } from "@/auth";
import { normalizeLoginTenantSlug } from "@/lib/auth/login-tenant";
import { setPendingTenantCookie } from "@/lib/auth/pending-tenant";
import { buildTenantUrlFromRequest } from "@/lib/tenants/request";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function signInWithGoogle(
  boundTenantSlugOrFormData?: unknown,
  _formData?: FormData,
) {
  void _formData;

  const slug = normalizeLoginTenantSlug(
    boundTenantSlugOrFormData instanceof FormData
      ? undefined
      : boundTenantSlugOrFormData,
  );

  const tenant = await prisma.tenant.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!tenant) {
    redirect("/login?error=tenant_not_found");
  }

  await setPendingTenantCookie({
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
  });

  await signIn("google", {
    redirectTo: await buildTenantUrlFromRequest("/tables", tenant.slug),
  });
}

export async function logout(redirectTo = "/login") {
  const safeRedirectTo =
    redirectTo === "/login" || redirectTo.startsWith("/login?")
      ? redirectTo
      : "/login";

  await signOut({ redirectTo: safeRedirectTo });
}
