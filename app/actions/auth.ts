"use server";

import { signIn, signOut } from "@/auth";
import { setPendingTenantCookie } from "@/lib/auth/pending-tenant";
import { buildTenantUrlFromRequest } from "@/lib/tenants/request";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

function normalizeTenantSlug(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function signInWithGoogle(formData?: FormData) {
  const slug = normalizeTenantSlug(formData?.get("tenantSlug") ?? null);

  if (!slug) {
    redirect("/login?error=tenant_required");
  }

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

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
