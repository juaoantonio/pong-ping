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
  const principal = await apiRequest<IdentityPrincipalResponseContract>(
    "/auth/me",
    {
      baseUrl: getTenantApiBaseUrl(),
    },
  );
  return validateTenantPrincipal(principal);
}

export function logoutTenantSession() {
  return apiRequest<AuthLogoutResponseContract>("/auth/logout", {
    baseUrl: getTenantApiBaseUrl(),
    method: "POST",
  });
}

export function getTenantLoginUrl(
  returnTo?: string,
  options: {
    apiBaseUrl?: string;
    authApiBaseUrl?: string;
    frontendHostname?: string;
  } = {},
) {
  const frontendHostname = options.frontendHostname ?? window.location.hostname;
  const url = new URL(
    `${getTenantAuthApiBaseUrl(options.apiBaseUrl, options.authApiBaseUrl)}/auth/google`,
  );
  const tenantSlug = getTenantSlugFromHostname(frontendHostname);
  const safeReturnTo = getSafeInternalRedirect(returnTo);

  if (tenantSlug) {
    url.searchParams.set("tenant", tenantSlug);
  }
  if (safeReturnTo) {
    url.searchParams.set("returnTo", safeReturnTo);
  }

  return url.toString();
}

export function getTenantAuthApiBaseUrl(
  apiBaseUrl = getApiBaseUrl(),
  authApiBaseUrl = import.meta.env.VITE_AUTH_API_BASE_URL?.trim(),
) {
  if (authApiBaseUrl) return authApiBaseUrl.replace(/\/+$/, "");

  return apiBaseUrl.replace(/\/+$/, "");
}

export function getTenantApiBaseUrl(
  baseUrl = getApiBaseUrl(),
) {
  return baseUrl.replace(/\/+$/, "");
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

function getTenantSlugFromHostname(hostname: string) {
  if (!isTenantFrontendHostname(hostname)) return undefined;
  return hostname.split(".")[0]?.toLowerCase();
}

function isTenantFrontendHostname(hostname: string) {
  return hostname.endsWith(".localhost") || hostname.split(".").length > 2;
}
