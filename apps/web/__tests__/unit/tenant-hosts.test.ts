/**
 * @jest-environment node
 */

import {
  buildTenantUrl,
  getTenantSlugFromHost,
  isAllowedTenantRedirectUrl,
} from "@/lib/tenants/hosts";

describe("helpers de host de tenant", () => {
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

  it("resolve slugs de tenant a partir de subdominios do dominio raiz configurado", () => {
    process.env.TENANT_ROOT_DOMAIN = "pong.test";

    expect(getTenantSlugFromHost("alpha.pong.test")).toBe("alpha");
    expect(getTenantSlugFromHost("alpha.pong.test:3000")).toBe("alpha");
    expect(getTenantSlugFromHost("pong.test")).toBeNull();
    expect(getTenantSlugFromHost("auth.pong.test")).toBeNull();
  });

  it("suporta subdominios locais de tenant sem configuracao de dominio raiz", () => {
    expect(getTenantSlugFromHost("beta.localhost:3000")).toBe("beta");
    expect(getTenantSlugFromHost("localhost:3000")).toBeNull();
  });

  it("monta URLs de tenant a partir do host da requisicao atual", () => {
    process.env.TENANT_ROOT_DOMAIN = "pong.test";

    expect(buildTenantUrl("/tables", "alpha", "auth.pong.test", "https")).toBe(
      "https://alpha.pong.test/tables",
    );
    expect(
      buildTenantUrl("/tables", "alpha", "auth.pong.test:3000", "http"),
    ).toBe("http://alpha.pong.test:3000/tables");
  });

  it("permite redirecionamentos pos-auth apenas para subdominios validos de tenant", () => {
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
