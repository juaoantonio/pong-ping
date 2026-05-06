import "server-only";

import { headers } from "next/headers";
import { canShareAuthCookiesAcrossSubdomains } from "@/lib/auth/cookies";
import { prisma } from "@/lib/prisma";
import { buildTenantUrl, getTenantSlugFromHost } from "@/lib/tenants/hosts";

export type RequestTenant = {
  id: string;
  slug: string;
  name: string;
};

async function getRequestOriginParts() {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    undefined;
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return { host, protocol };
}

export async function getTenantFromRequestHost(): Promise<RequestTenant | null> {
  const { host } = await getRequestOriginParts();
  const slug = getTenantSlugFromHost(host);

  if (!slug) {
    return null;
  }

  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

export async function buildTenantUrlFromRequest(path: string, tenantSlug: string) {
  if (!canShareAuthCookiesAcrossSubdomains()) {
    return path;
  }

  const { host, protocol } = await getRequestOriginParts();

  return buildTenantUrl(path, tenantSlug, host, protocol);
}
