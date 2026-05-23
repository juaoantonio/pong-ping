import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/errors";
import { authKeys } from "@/lib/api/system-admin";
import {
  getTenantApiBaseUrl,
  getTenantAuthApiBaseUrl,
  getTenantLoginUrl,
  getTenantMe,
  logoutTenantSession,
  tenantAuthKeys,
  tenantMeQueryOptions,
} from "@/lib/api/tenant-auth";

const tenantPrincipal = {
  userId: "user-1",
  tenantId: "tenant-1",
  sessionId: "session-1",
  systemRoles: [],
  tenantRoles: ["member"],
};

function mockResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

describe("tenant auth api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("uses a tenant auth query key separate from system auth", () => {
    expect(tenantAuthKeys.me).toEqual(["tenant-auth", "me"]);
    expect(tenantAuthKeys.me).not.toEqual(authKeys.me);
  });

  it("builds tenant me query options with retries disabled", () => {
    expect(tenantMeQueryOptions()).toMatchObject({
      queryKey: tenantAuthKeys.me,
      retry: false,
    });
  });

  it("fetches the tenant principal from /auth/me with credentials", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: tenantPrincipal,
        meta: { timestamp: "2026-05-09T12:00:00.000Z" },
      }),
    );

    await expect(getTenantMe()).resolves.toEqual(tenantPrincipal);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("fetches tenant auth through the central API host when the frontend is tenant-scoped", async () => {
    vi.stubGlobal("location", new URL("http://teste.localhost.me:5173/club"));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: tenantPrincipal,
        meta: { timestamp: "2026-05-09T12:00:00.000Z" },
      }),
    );

    await expect(getTenantMe()).resolves.toEqual(tenantPrincipal);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/auth/me",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("rejects principals without tenant context", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: { ...tenantPrincipal, tenantId: null, tenantRoles: [] },
        meta: { timestamp: "2026-05-09T12:00:00.000Z" },
      }),
    );

    await expect(getTenantMe()).rejects.toMatchObject({
      code: "TENANT_AUTH_REQUIRED",
      status: 403,
    });
  });

  it("logs out with the tenant endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: { revoked: true },
        meta: { timestamp: "2026-05-09T12:00:00.000Z" },
      }),
    );

    await expect(logoutTenantSession()).resolves.toEqual({ revoked: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/auth/logout",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  it("builds the tenant Google login URL on the central API host", () => {
    expect(getTenantLoginUrl()).toBe(
      "http://api.localhost.me:3001/v1/auth/google",
    );
    expect(
      getTenantLoginUrl("/club", {
        apiBaseUrl: "http://api.localhost.me:3001/v1",
        authApiBaseUrl: "",
        frontendHostname: "acme.localhost.me",
      }),
    ).toBe(
      "http://api.localhost.me:3001/v1/auth/google?tenant=acme&returnTo=%2Fclub",
    );
    expect(
      getTenantLoginUrl("/club", {
        apiBaseUrl: "http://localhost:3001/v1",
        authApiBaseUrl: "",
        frontendHostname: "acme.localhost",
      }),
    ).toBe("http://localhost:3001/v1/auth/google?tenant=acme&returnTo=%2Fclub");
    expect(
      getTenantLoginUrl("/club/settings", {
        apiBaseUrl: "https://api.pongping.example/v1",
        authApiBaseUrl: "",
        frontendHostname: "acme.pongping.example",
      }),
    ).toBe(
      "https://api.pongping.example/v1/auth/google?tenant=acme&returnTo=%2Fclub%2Fsettings",
    );
  });

  it("uses configured auth API base and rejects external returnTo", () => {
    expect(
      getTenantLoginUrl("https://example.com/club", {
        apiBaseUrl: "http://localhost:3001/v1",
        authApiBaseUrl: "https://login.pongping.example/v1",
        frontendHostname: "acme.pongping.example",
      }),
    ).toBe("https://login.pongping.example/v1/auth/google?tenant=acme");
    expect(
      getTenantLoginUrl("//example.com/club", {
        apiBaseUrl: "http://localhost:3001/v1",
        authApiBaseUrl: "",
        frontendHostname: "acme.localhost",
      }),
    ).toBe("http://localhost:3001/v1/auth/google?tenant=acme");
  });

  it("builds the tenant dev Google login URL with a user alias", () => {
    expect(
      getTenantLoginUrl("/club", {
        apiBaseUrl: "http://api.localhost.me:3001/v1",
        authApiBaseUrl: "",
        frontendHostname: "acme.localhost.me",
        devBypassEnabled: true,
        userAlias: "member",
      }),
    ).toBe(
      "http://api.localhost.me:3001/v1/auth/dev/google?tenant=acme&returnTo=%2Fclub&user=member",
    );
  });

  it("builds the central auth API base from the tenant host", () => {
    expect(
      getTenantAuthApiBaseUrl(
        "http://api.localhost.me:3001/v1",
        "",
      ),
    ).toBe("http://api.localhost.me:3001/v1");
    expect(
      getTenantAuthApiBaseUrl(
        "http://localhost:3001/v1",
        "",
      ),
    ).toBe("http://localhost:3001/v1");
    expect(
      getTenantAuthApiBaseUrl(
        "https://api.pongping.example/v1",
        "",
      ),
    ).toBe("https://api.pongping.example/v1");
    expect(
      getTenantAuthApiBaseUrl(
        "http://localhost:3001/v1",
        "https://login.pongping.example/v1",
      ),
    ).toBe("https://login.pongping.example/v1");
  });

  it("keeps tenant API calls on the central API host", () => {
    expect(
      getTenantApiBaseUrl("http://localhost:3001/v1"),
    ).toBe("http://localhost:3001/v1");
    expect(
      getTenantApiBaseUrl(
        "https://api.pongping.example/v1",
      ),
    ).toBe("https://api.pongping.example/v1");
    expect(getTenantApiBaseUrl("http://localhost:3001/v1")).toBe(
      "http://localhost:3001/v1",
    );
  });

  it("uses a visible tenant auth error for invalid tenant principals", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse({
        ok: true,
        data: { ...tenantPrincipal, tenantRoles: [] },
        meta: { timestamp: "2026-05-09T12:00:00.000Z" },
      }),
    );

    await expect(getTenantMe()).rejects.toBeInstanceOf(ApiClientError);
  });
});
