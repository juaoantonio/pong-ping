import { queryOptions } from "@tanstack/react-query";
import type {
  AuthLogoutResponseContract,
  CreateSystemMembershipRequestContract,
  CreateSystemTenantRequestContract,
  IdentityPrincipalResponseContract,
  SystemMembershipDeactivationResponseContract,
  SystemMembershipResponseContract,
  SystemTenantResponseContract,
  UpdateSystemMembershipRequestContract,
  UpdateSystemTenantRequestContract,
} from "@pong-ping/contracts";
import { apiRequest } from "@/lib/api/client";

export const authKeys = {
  me: ["system-auth", "me"] as const,
};

export const tenantKeys = {
  all: ["system-admin", "tenants"] as const,
  memberships: (tenantId: string) => ["system-admin", "tenants", tenantId, "memberships"] as const,
};

export function systemMeQueryOptions() {
  return queryOptions({
    queryKey: authKeys.me,
    queryFn: getSystemMe,
    retry: false,
  });
}

export function systemTenantsQueryOptions() {
  return queryOptions({
    queryKey: tenantKeys.all,
    queryFn: listSystemTenants,
  });
}

export function systemMembershipsQueryOptions(tenantId: string) {
  return queryOptions({
    queryKey: tenantKeys.memberships(tenantId),
    queryFn: () => listSystemMemberships(tenantId),
  });
}

export function getSystemMe() {
  return apiRequest<IdentityPrincipalResponseContract>("/system/auth/me");
}

export function logoutSystemSession() {
  return apiRequest<AuthLogoutResponseContract>("/system/auth/logout", { method: "POST" });
}

export function listSystemTenants() {
  return apiRequest<SystemTenantResponseContract[]>("/system/admin/tenants");
}

export function createSystemTenant(input: CreateSystemTenantRequestContract) {
  return apiRequest<SystemTenantResponseContract, CreateSystemTenantRequestContract>(
    "/system/admin/tenants",
    {
      method: "POST",
      body: input,
    },
  );
}

export function updateSystemTenant(tenantId: string, input: UpdateSystemTenantRequestContract) {
  return apiRequest<SystemTenantResponseContract, UpdateSystemTenantRequestContract>(
    `/system/admin/tenants/${encodeURIComponent(tenantId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export function listSystemMemberships(tenantId: string) {
  return apiRequest<SystemMembershipResponseContract[]>(
    `/system/admin/tenants/${encodeURIComponent(tenantId)}/memberships`,
  );
}

export function createSystemMembership(
  tenantId: string,
  input: CreateSystemMembershipRequestContract,
) {
  return apiRequest<SystemMembershipResponseContract, CreateSystemMembershipRequestContract>(
    `/system/admin/tenants/${encodeURIComponent(tenantId)}/memberships`,
    {
      method: "POST",
      body: input,
    },
  );
}

export function updateSystemMembership(
  tenantId: string,
  membershipId: string,
  input: UpdateSystemMembershipRequestContract,
) {
  return apiRequest<SystemMembershipResponseContract, UpdateSystemMembershipRequestContract>(
    `/system/admin/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      body: input,
    },
  );
}

export function deactivateSystemMembership(tenantId: string, membershipId: string) {
  return apiRequest<SystemMembershipDeactivationResponseContract>(
    `/system/admin/tenants/${encodeURIComponent(tenantId)}/memberships/${encodeURIComponent(membershipId)}`,
    { method: "DELETE" },
  );
}
