import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { CurrentContextService } from "../../../common/context";
import type { SessionService } from "../session/session.service";
import { SystemAuthController } from "./system-auth.controller";

describe("SystemAuthController", () => {
  it("creates a system session cookie and redirects on Google callback", async () => {
    const auth = {
      completeSystemGoogleLogin: vi.fn(async () => ({
        session: { id: "session-1" },
        token: "raw-token",
      })),
    };
    const response = { cookie: vi.fn(), redirect: vi.fn() } as unknown as Response;
    const controller = new SystemAuthController(
      fakeConfig(),
      auth as never,
      {} as CurrentContextService,
      {} as SessionService,
    );

    await controller.googleCallback(
      {
        user: {
          googleSubject: "google-1",
          email: "operator@example.test",
          displayName: "Operator",
          avatarUrl: null,
        },
        headers: { "user-agent": "vitest" },
        ip: "127.0.0.1",
      } as never,
      response,
    );

    expect(auth.completeSystemGoogleLogin).toHaveBeenCalledWith(
      expect.objectContaining({ googleSubject: "google-1" }),
      { userAgent: "vitest", ipAddress: "127.0.0.1" },
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "sid",
      "raw-token",
      expect.objectContaining({ httpOnly: true, maxAge: 3_600_000, path: "/" }),
    );
    expect(response.redirect).toHaveBeenCalledWith("http://localhost:5173/admin/tenants");
  });

  it("revokes the current system session and clears the cookie", async () => {
    const sessions = { revokeSession: vi.fn() };
    const response = { clearCookie: vi.fn() } as unknown as Response;
    const controller = new SystemAuthController(
      fakeConfig(),
      { getMe: vi.fn() } as never,
      { getPrincipalOrThrow: () => ({ sessionId: "session-1" }) } as never,
      sessions as never,
    );

    await expect(controller.logout(response)).resolves.toEqual({ revoked: true });
    expect(sessions.revokeSession).toHaveBeenCalledWith("session-1");
    expect(response.clearCookie).toHaveBeenCalledWith(
      "sid",
      expect.objectContaining({ httpOnly: true, maxAge: 0, path: "/" }),
    );
  });
});

function fakeConfig() {
  return {
    getOrThrow: (key: keyof ConfigSchema) => {
      if (key === "SESSION_COOKIE_NAME") return "sid";
      if (key === "SESSION_TTL_SECONDS") return 3600;
      if (key === "NODE_ENV") return "test";
      if (key === "SYSTEM_ADMIN_FRONTEND_URL") return "http://localhost:5173/admin/tenants";
      throw new Error(`Missing config key ${key}`);
    },
  } as never;
}
