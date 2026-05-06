"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_LOGIN_TENANT_SLUG,
  LOGIN_TENANT_STORAGE_KEY,
  normalizeLoginTenantSlug,
} from "@/lib/auth/login-tenant";

function isValidLoginTenantSlug(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);
}

function getStoredTenantSlug() {
  try {
    return window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTenantSlug(tenantSlug: string) {
  try {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, tenantSlug);
  } catch {
    // Storage is only a convenience; the URL query remains authoritative.
  }
}

function clearStoredTenantSlug() {
  try {
    window.localStorage.removeItem(LOGIN_TENANT_STORAGE_KEY);
  } catch {
    // Storage is only a convenience; the URL query remains authoritative.
  }
}

export function LoginTenantMemory() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tenantQueries = searchParams.getAll("tenant");

    if (tenantQueries.length === 1) {
      const tenantQuery = tenantQueries[0];

      if (!tenantQuery?.trim()) {
        return;
      }

      const tenantSlug = normalizeLoginTenantSlug(tenantQuery);

      if (isValidLoginTenantSlug(tenantSlug)) {
        setStoredTenantSlug(tenantSlug);
      }

      return;
    }

    if (tenantQueries.length > 1) {
      return;
    }

    if (searchParams.get("error") === "tenant_not_found") {
      clearStoredTenantSlug();
      return;
    }

    const storedSlug = normalizeLoginTenantSlug(getStoredTenantSlug());

    if (
      storedSlug === DEFAULT_LOGIN_TENANT_SLUG ||
      !isValidLoginTenantSlug(storedSlug)
    ) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tenant", storedSlug);

    router.replace(`${pathname}?${nextParams.toString()}`);
  }, [pathname, router, searchParams]);

  return null;
}
