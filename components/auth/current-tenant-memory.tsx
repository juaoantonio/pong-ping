"use client";

import { useEffect } from "react";
import { LOGIN_TENANT_STORAGE_KEY } from "@/lib/auth/login-tenant";

export function CurrentTenantMemory({ tenantSlug }: { tenantSlug?: string | null }) {
  useEffect(() => {
    if (!tenantSlug) {
      return;
    }

    try {
      window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, tenantSlug);
    } catch {
      // Storage is only a convenience for the next login visit.
    }
  }, [tenantSlug]);

  return null;
}
