import { BadRequestException } from "@nestjs/common";
import { TENANT_ADMIN_ROLES, TENANT_ROLES, type IdentityTenantRole } from "../identity-roles";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeTenantSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function assertTenantSlugAllowed(
  slug: string,
  reservedSubdomains: readonly string[],
): string {
  const normalized = normalizeTenantSlug(slug);
  if (!SLUG_PATTERN.test(normalized)) {
    throw new BadRequestException("Tenant slug must be a valid subdomain label.");
  }

  if (reservedSubdomains.map((reserved) => reserved.toLowerCase()).includes(normalized)) {
    throw new BadRequestException("Tenant slug is reserved.");
  }

  return normalized;
}

export function assertTenantRoles(roles: readonly IdentityTenantRole[]): IdentityTenantRole[] {
  if (!roles.length) {
    throw new BadRequestException("At least one tenant role is required.");
  }

  const allowed = new Set<string>(TENANT_ROLES);
  if (!roles.every((role) => allowed.has(role))) {
    throw new BadRequestException("Invalid tenant role.");
  }

  return [...new Set(roles)];
}

export function hasTenantAdminRole(roles: readonly IdentityTenantRole[]): boolean {
  return roles.some((role) => (TENANT_ADMIN_ROLES as readonly IdentityTenantRole[]).includes(role));
}
