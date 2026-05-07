import {
  DEFAULT_LOGIN_TENANT_SLUG,
  normalizeLoginTenantSlug,
} from "@/lib/auth/login-tenant";

describe("normalizacao do slug de tenant no login", () => {
  it.each([
    [undefined, DEFAULT_LOGIN_TENANT_SLUG],
    [null, DEFAULT_LOGIN_TENANT_SLUG],
    ["", DEFAULT_LOGIN_TENANT_SLUG],
    ["   ", DEFAULT_LOGIN_TENANT_SLUG],
    [["alpha", "beta"], DEFAULT_LOGIN_TENANT_SLUG],
    [{ slug: "alpha" }, DEFAULT_LOGIN_TENANT_SLUG],
    [42, DEFAULT_LOGIN_TENANT_SLUG],
    ["  AcMe  ", "acme"],
  ])("normalizes %p to %p", (value, expected) => {
    expect(normalizeLoginTenantSlug(value)).toBe(expected);
  });
});
