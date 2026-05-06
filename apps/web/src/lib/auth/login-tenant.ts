export const DEFAULT_LOGIN_TENANT_SLUG = "default";
export const LOGIN_TENANT_STORAGE_KEY = "pong_ping_current_login_tenant";

export function normalizeLoginTenantSlug(value: unknown) {
  if (typeof value !== "string") {
    return DEFAULT_LOGIN_TENANT_SLUG;
  }

  const slug = value.trim().toLowerCase();

  return slug || DEFAULT_LOGIN_TENANT_SLUG;
}
