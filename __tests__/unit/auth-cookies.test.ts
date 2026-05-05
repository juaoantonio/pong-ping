/**
 * @jest-environment node
 */

describe("auth cookie config", () => {
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

  it("does not override Auth.js cookies without a shared domain", async () => {
    const { sharedAuthCookies } = await import("@/lib/auth/cookies");

    expect(sharedAuthCookies()).toBeUndefined();
  });

  it("does not use localhost as a shared cookie domain", async () => {
    process.env.AUTH_COOKIE_DOMAIN = ".localhost";
    const { canShareAuthCookiesAcrossSubdomains, sharedAuthCookies } =
      await import("@/lib/auth/cookies");

    expect(canShareAuthCookiesAcrossSubdomains()).toBe(false);
    expect(sharedAuthCookies()).toBeUndefined();
  });

  it("scopes Auth.js session cookies to a real configured parent domain", async () => {
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
