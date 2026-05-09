import { queryOptions } from "@tanstack/react-query";
import type {
  AuthLogoutResponseContract,
  IdentityPrincipalResponseContract,
} from "@pong-ping/contracts";
import { apiRequest, getApiBaseUrl } from "@/lib/api/client";
import { ApiClientError } from "@/lib/api/errors";

export const tenantAuthKeys = {
  me: ["tenant-auth", "me"] as const,
};

export function tenantMeQueryOptions() {
  return queryOptions({
    queryKey: tenantAuthKeys.me,
    queryFn: getTenantMe,
    retry: false,
  });
}

export async function getTenantMe() {
  const principal = await apiRequest<IdentityPrincipalResponseContract>("/auth/me");
  return validateTenantPrincipal(principal);
}

export function logoutTenantSession() {
  return apiRequest<AuthLogoutResponseContract>("/auth/logout", { method: "POST" });
}

export function getTenantLoginUrl(redirect?: string) {
  const url = new URL(`${getApiBaseUrl()}/auth/google`);
  const safeRedirect = getSafeInternalRedirect(redirect);

  if (safeRedirect) {
    url.searchParams.set("redirect", safeRedirect);
  }

  return url.toString();
}

function validateTenantPrincipal(principal: IdentityPrincipalResponseContract) {
  if (principal.tenantId === null || principal.tenantRoles.length === 0) {
    throw new ApiClientError("Sessao de clube obrigatoria.", {
      code: "TENANT_AUTH_REQUIRED",
      status: 403,
    });
  }

  return principal;
}

function getSafeInternalRedirect(redirect?: string) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return undefined;
  }

  return redirect;
}
