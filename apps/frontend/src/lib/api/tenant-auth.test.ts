import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/errors";
import { authKeys } from "@/lib/api/system-admin";
import {
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
      "http://localhost:3001/v1/auth/me",
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
      "http://localhost:3001/v1/auth/logout",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
  });

  it("builds the tenant Google login URL with safe redirect paths only", () => {
    expect(getTenantLoginUrl()).toBe("http://localhost:3001/v1/auth/google");
    expect(getTenantLoginUrl("/club/settings")).toBe(
      "http://localhost:3001/v1/auth/google?redirect=%2Fclub%2Fsettings",
    );
    expect(getTenantLoginUrl("https://example.com/club")).toBe(
      "http://localhost:3001/v1/auth/google",
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
