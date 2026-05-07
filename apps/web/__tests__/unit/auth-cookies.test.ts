/**
 * @jest-environment node
 */

describe("configuracao de cookies de auth", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthCookieDomain = process.env.AUTH_COOKIE_DOMAIN;

  function restoreEnv(key: string, value: string | undefined) {
    if (value === undefined) {
      delete process.env[key];
      return;
    }

    process.env[key] = value;
  }

  beforeEach(() => {
    jest.resetModules();
    delete process.env.AUTH_COOKIE_DOMAIN;
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "test",
      configurable: true,
    });
  });

  afterAll(() => {
    restoreEnv("AUTH_COOKIE_DOMAIN", originalAuthCookieDomain);
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  it("nao sobrescreve cookies do Auth.js sem dominio compartilhado", async () => {
    const { sharedAuthCookies } = await import("@/lib/auth/cookies");

    expect(sharedAuthCookies()).toBeUndefined();
  });

  it("nao usa localhost como dominio compartilhado de cookie", async () => {
    process.env.AUTH_COOKIE_DOMAIN = ".localhost";
    const { canShareAuthCookiesAcrossSubdomains, sharedAuthCookies } =
      await import("@/lib/auth/cookies");

    expect(canShareAuthCookiesAcrossSubdomains()).toBe(false);
    expect(sharedAuthCookies()).toBeUndefined();
  });

  it("limita cookies de sessao do Auth.js a um dominio pai real configurado", async () => {
    process.env.AUTH_COOKIE_DOMAIN = ".pong.test";
    const { canShareAuthCookiesAcrossSubdomains, sharedAuthCookies } =
      await import("@/lib/auth/cookies");

    expect(canShareAuthCookiesAcrossSubdomains()).toBe(true);
    expect(sharedAuthCookies()).toMatchObject({
      sessionToken: {
        name: "authjs.session-token",
        options: {
          domain: ".pong.test",
          httpOnly: true,
          path: "/",
          sameSite: "lax",
          secure: false,
        },
      },
      state: {
        name: "authjs.state",
        options: {
          domain: ".pong.test",
          maxAge: 900,
        },
      },
    });
  });
});
