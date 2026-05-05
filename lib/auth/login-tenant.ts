export const DEFAULT_LOGIN_TENANT_SLUG = "default";

export function normalizeLoginTenantSlug(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_LOGIN_TENANT_SLUG;
  }

  const slug = value.trim().toLowerCase();

  return slug || DEFAULT_LOGIN_TENANT_SLUG;
}
