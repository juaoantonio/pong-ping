import { SetMetadata } from "@nestjs/common";
import type { IdentitySystemRole, IdentityTenantRole } from "../identity-roles";

export const IS_PUBLIC_KEY = "identity:isPublic";
export const SYSTEM_ROLES_KEY = "identity:systemRoles";
export const TENANT_ROLES_KEY = "identity:tenantRoles";

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const RequireSystemRoles = (...roles: IdentitySystemRole[]) =>
  SetMetadata(SYSTEM_ROLES_KEY, roles);
export const RequireTenantRoles = (...roles: IdentityTenantRole[]) =>
  SetMetadata(TENANT_ROLES_KEY, roles);
