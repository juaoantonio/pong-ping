import { ConflictException, ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { IDENTITY_SYSTEM_ROLE, IDENTITY_TENANT_ROLE } from "../identity-roles";
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
    const sessions = {
      createTenantSession: vi.fn(async () => ({
        session: { id: "session-1" },
        token: "raw-token",
      })),
    };
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      sessions as never,
      repository() as never,
      {
        findOne: vi.fn(async () => ({ id: "membership-1", roles: [IDENTITY_TENANT_ROLE.ADMIN] })),
      } as never,
      { findOne: vi.fn() } as never,
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

    expect(sessions.createTenantSession).toHaveBeenCalledWith({
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
      { createTenantSession: vi.fn() } as never,
      repository() as never,
      { findOne: vi.fn(async () => undefined) } as never,
      { findOne: vi.fn() } as never,
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
    users.findOne = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce({
      id: "user-1",
      googleSubject: "google-1",
    });
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      { createTenantSession: vi.fn() } as never,
      users as never,
      {
        findOne: vi.fn(async () => ({ id: "membership-1", roles: [IDENTITY_TENANT_ROLE.ADMIN] })),
      } as never,
      { findOne: vi.fn() } as never,
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

  it("vincula usuario pendente por email no primeiro login google", async () => {
    const pendingUser = {
      id: "user-1",
      googleSubject: null,
      email: "user@example.test",
      active: true,
    };
    const users = repository();
    users.findOne = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(pendingUser);
    const service = new AuthService(
      { getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }) } as never,
      {
        createTenantSession: vi.fn(async () => ({
          session: { id: "session-1" },
          token: "raw-token",
        })),
      } as never,
      users as never,
      {
        findOne: vi.fn(async () => ({ id: "membership-1", roles: [IDENTITY_TENANT_ROLE.ADMIN] })),
      } as never,
      { findOne: vi.fn() } as never,
    );

    await service.completeGoogleLogin(
      {
        googleSubject: "google-1",
        email: "USER@example.test",
        displayName: "User",
        avatarUrl: null,
      },
      {},
    );

    expect(users.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        googleSubject: "google-1",
        displayName: "User",
      }),
    );
  });

  it("cria sessao de sistema apenas para system_admin", async () => {
    const sessions = {
      createSystemSession: vi.fn(async () => ({
        session: { id: "session-1" },
        token: "raw-token",
      })),
    };
    const service = new AuthService(
      {} as never,
      sessions as never,
      repository() as never,
      { findOne: vi.fn() } as never,
      {
        findOne: vi.fn(async () => ({ id: "role-1", role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN })),
      } as never,
    );

    await service.completeSystemGoogleLogin(
      {
        googleSubject: "google-1",
        email: "operator@example.test",
        displayName: "Operator",
        avatarUrl: null,
      },
      { userAgent: "vitest" },
    );

    expect(sessions.createSystemSession).toHaveBeenCalledWith({
      userId: "user-1",
      userAgent: "vitest",
      ipAddress: undefined,
    });
  });

  it("rejeita sessao de sistema para usuario sem system_admin", async () => {
    const service = new AuthService(
      {} as never,
      { createSystemSession: vi.fn() } as never,
      repository() as never,
      { findOne: vi.fn() } as never,
      { findOne: vi.fn(async () => undefined) } as never,
    );

    await expect(
      service.completeSystemGoogleLogin(
        {
          googleSubject: "google-1",
          email: "operator@example.test",
          displayName: "Operator",
          avatarUrl: null,
        },
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
