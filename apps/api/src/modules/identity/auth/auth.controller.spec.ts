import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { CurrentContextService } from "../../../common/context";
import type { SessionService } from "../session/session.service";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  it("creates a tenant session cookie and redirects on Google callback", async () => {
    const auth = {
      completeGoogleLogin: vi.fn(async () => ({
        session: { id: "session-1" },
        token: "raw-token",
      })),
    };
    const response = { cookie: vi.fn(), redirect: vi.fn() } as unknown as Response;
    const controller = new AuthController(
      fakeConfig(),
      auth as never,
      {} as CurrentContextService,
      {} as SessionService,
    );

    await controller.googleCallback(
      {
        user: {
          googleSubject: "google-1",
          email: "member@example.test",
          displayName: "Member",
          avatarUrl: null,
        },
        headers: { "user-agent": "vitest" },
        ip: "127.0.0.1",
      } as never,
      response,
    );

    expect(auth.completeGoogleLogin).toHaveBeenCalledWith(
      expect.objectContaining({ googleSubject: "google-1" }),
      { userAgent: "vitest", ipAddress: "127.0.0.1" },
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "sid",
      "raw-token",
      expect.objectContaining({ httpOnly: true, maxAge: 3_600_000, path: "/" }),
    );
    expect(response.redirect).toHaveBeenCalledWith("http://localhost:5173/club");
  });
});

function fakeConfig() {
  return {
    getOrThrow: (key: keyof ConfigSchema) => {
      if (key === "SESSION_COOKIE_NAME") return "sid";
      if (key === "SESSION_TTL_SECONDS") return 3600;
      if (key === "NODE_ENV") return "test";
      if (key === "TENANT_FRONTEND_URL") return "http://localhost:5173/club";
      throw new Error(`Missing config key ${key}`);
    },
  } as never;
}
