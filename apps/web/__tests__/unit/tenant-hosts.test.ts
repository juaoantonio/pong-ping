/**
 * @jest-environment node
 */

import {
  buildTenantUrl,
  getTenantSlugFromHost,
  isAllowedTenantRedirectUrl,
} from "@/lib/tenants/hosts";

describe("tenant host helpers", () => {
  const originalTenantRootDomain = process.env.TENANT_ROOT_DOMAIN;
  const originalPublicTenantRootDomain =
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
  const originalAuthCookieDomain = process.env.AUTH_COOKIE_DOMAIN;

  function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  }

  beforeEach(() => {
    delete process.env.TENANT_ROOT_DOMAIN;
    delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    delete process.env.AUTH_COOKIE_DOMAIN;
  });

  afterAll(() => {
    restoreEnv("TENANT_ROOT_DOMAIN", originalTenantRootDomain);
    restoreEnv(
      "NEXT_PUBLIC_TENANT_ROOT_DOMAIN",
      originalPublicTenantRootDomain,
    );
    restoreEnv("AUTH_COOKIE_DOMAIN", originalAuthCookieDomain);
  });

  it("resolves tenant slugs from configured root-domain subdomains", () => {
    process.env.TENANT_ROOT_DOMAIN = "pong.test";

    expect(getTenantSlugFromHost("alpha.pong.test")).toBe("alpha");
    expect(getTenantSlugFromHost("alpha.pong.test:3000")).toBe("alpha");
    expect(getTenantSlugFromHost("pong.test")).toBeNull();
    expect(getTenantSlugFromHost("auth.pong.test")).toBeNull();
  });

  it("supports local tenant subdomains without a root-domain setting", () => {
    expect(getTenantSlugFromHost("beta.localhost:3000")).toBe("beta");
    expect(getTenantSlugFromHost("localhost:3000")).toBeNull();
  });

  it("builds tenant URLs from the current request host", () => {
    process.env.TENANT_ROOT_DOMAIN = "pong.test";

    expect(buildTenantUrl("/tables", "alpha", "auth.pong.test", "https")).toBe(
      "https://alpha.pong.test/tables",
    );
    expect(
      buildTenantUrl("/tables", "alpha", "auth.pong.test:3000", "http"),
    ).toBe("http://alpha.pong.test:3000/tables");
  });

  it("allows post-auth redirects only to valid tenant subdomains", () => {
    process.env.TENANT_ROOT_DOMAIN = "pong.test";

    expect(
      isAllowedTenantRedirectUrl(
        "https://alpha.pong.test/tables",
        "https://auth.pong.test",
      ),
    ).toBe(true);
    expect(
      isAllowedTenantRedirectUrl(
        "https://evil.test/tables",
        "https://auth.pong.test",
      ),
    ).toBe(false);
    expect(
      isAllowedTenantRedirectUrl(
        "https://auth.pong.test/tables",
        "https://auth.pong.test",
      ),
    ).toBe(true);
  });
});
