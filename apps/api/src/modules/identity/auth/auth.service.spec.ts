import { ConflictException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { AuthService } from "./auth.service";

function repository(existing?: unknown) {
  return {
    findOne: vi.fn(async () => existing),
    create: vi.fn((value) => value),
    save: vi.fn(async (value) => ({ id: "user-1", ...value })),
  };
}

describe("AuthService", () => {
  it("cria sessao para profile google com membership ativo no tenant atual", async () => {
    const sessions = { createSession: vi.fn(async () => ({ session: { id: "session-1" }, token: "raw-token" })) };
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      sessions as never,
      repository() as never,
      { findOne: vi.fn(async () => ({ id: "membership-1", roles: ["owner"] })) } as never,
    );

    const created = await service.completeGoogleLogin(
      {
        googleSubject: "google-1",
        email: "user@example.test",
        displayName: "User",
        avatarUrl: null,
      },
      { userAgent: "vitest", ipAddress: "127.0.0.1" },
    );

    expect(sessions.createSession).toHaveBeenCalledWith({
      userId: "user-1",
      tenantId: "tenant-1",
      userAgent: "vitest",
      ipAddress: "127.0.0.1",
    });
    expect(created.token).toBe("raw-token");
  });

  it("rejeita login google sem membership ativo no tenant atual", async () => {
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      { createSession: vi.fn() } as never,
      repository() as never,
      { findOne: vi.fn(async () => undefined) } as never,
    );

    await expect(
      service.completeGoogleLogin(
        {
          googleSubject: "google-1",
          email: "user@example.test",
          displayName: "User",
          avatarUrl: null,
        },
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("rejeita email ja vinculado a outro subject google", async () => {
    const users = repository();
    users.findOne = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: "user-1" });
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      { createSession: vi.fn() } as never,
      users as never,
      { findOne: vi.fn(async () => ({ id: "membership-1", roles: ["owner"] })) } as never,
    );

    await expect(
      service.completeGoogleLogin(
        {
          googleSubject: "google-2",
          email: "user@example.test",
          displayName: "User",
          avatarUrl: null,
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });
});
