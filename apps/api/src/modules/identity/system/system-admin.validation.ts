import { BadRequestException } from "@nestjs/common";
import { TENANT_ROLES, type TenantRole } from "../entities";

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeTenantSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

export function assertTenantSlugAllowed(slug: string, reservedSubdomains: readonly string[]): string {
  const normalized = normalizeTenantSlug(slug);
  if (!SLUG_PATTERN.test(normalized)) {
    throw new BadRequestException("Tenant slug must be a valid subdomain label.");
  }

  if (reservedSubdomains.map((reserved) => reserved.toLowerCase()).includes(normalized)) {
    throw new BadRequestException("Tenant slug is reserved.");
  }

  return normalized;
}

export function assertTenantRoles(roles: readonly TenantRole[]): TenantRole[] {
  if (!roles.length) {
    throw new BadRequestException("At least one tenant role is required.");
  }

  const allowed = new Set<string>(TENANT_ROLES);
  if (!roles.every((role) => allowed.has(role))) {
    throw new BadRequestException("Invalid tenant role.");
  }

  return [...new Set(roles)];
}

export function hasTenantAdminRole(roles: readonly TenantRole[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}
