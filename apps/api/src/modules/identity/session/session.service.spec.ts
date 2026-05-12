import type { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { FindOneOptions, FindOptionsWhere, Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import type { IdentityPrincipal, TenantContext } from "../../../common/context";
import {
  IdentitySessionEntity,
  IdentityUserEntity,
  SystemRoleAssignmentEntity,
  TenantMembershipEntity,
  TenantEntity,
} from "../entities";
import { IDENTITY_SYSTEM_ROLE, IDENTITY_TENANT_ROLE } from "../identity-roles";
import { SESSION_VALIDATION_FAILURE, SessionValidationError } from "./session-validation.error";
import { SessionCookieService } from "./session-cookie.service";
import { SessionMiddleware } from "./session.middleware";
import { SessionService } from "./session.service";

describe("SessionService", () => {
  it("creates high-entropy opaque sessions and persists only token hashes", async () => {
    const fixture = createFixture();

    const created = await fixture.service.createSession({
      userId: "user-1",
      tenantId: "tenant-1",
      userAgent: "vitest",
      ipAddress: "127.0.0.1",
    });

    expect(created.token).toHaveLength(43);
    expect(created.session.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(created.session.tokenHash).not.toBe(created.token);
    expect("token" in fixture.sessions.saved[0]).toBe(false);
  });

  it("creates system-scoped sessions without a tenant", async () => {
    const fixture = createFixture();

    const created = await fixture.service.createSystemSession({ userId: "user-1" });

    expect(created.session.tenantId).toBeNull();
    expect(created.session.tenant).toBeNull();
  });

  it("validates a live session and returns the identity principal", async () => {
    const fixture = createFixture();
    const created = await fixture.service.createSession({ userId: "user-1", tenantId: "tenant-1" });

    const principal = await fixture.service.validateTenantSession(created.token, "tenant-1");

    expect(principal).toEqual({
      userId: "user-1",
      tenantId: "tenant-1",
      sessionId: created.session.id,
      tenantRoles: [IDENTITY_TENANT_ROLE.ADMIN],
      systemRoles: [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN],
    });
  });

  it("rejects missing and unknown tokens", async () => {
    const fixture = createFixture();

    await expect(
      fixture.service.validateTenantSession(undefined, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.Missing,
    });
    await expect(
      fixture.service.validateTenantSession("unknown", "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.Unknown,
    });
  });

  it("rejects expired, revoked, inactive, and tenant-mismatched sessions", async () => {
    const fixture = createFixture();
    const created = await fixture.service.createSession({ userId: "user-1", tenantId: "tenant-1" });

    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-2"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.TenantMismatch,
    });

    created.session.revokedAt = new Date();
    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.Revoked,
    });

    created.session.revokedAt = null;
    created.session.expiresAt = new Date(Date.now() - 1);
    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.Expired,
    });

    created.session.expiresAt = new Date(Date.now() + 60_000);
    created.session.user.active = false;
    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.InactiveUser,
    });

    created.session.user.active = true;
    created.session.tenant!.active = false;
    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.InactiveTenant,
    });

    created.session.tenant!.active = true;
    fixture.memberships.records[0].active = false;
    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.InactiveMembership,
    });
  });

  it("validates system sessions only when the user has system_admin", async () => {
    const fixture = createFixture();
    const created = await fixture.service.createSystemSession({ userId: "user-1" });

    await expect(
      fixture.service.validateTenantSession(created.token, "tenant-1"),
    ).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.TenantMismatch,
    });

    const principal = await fixture.service.validateSystemSession(created.token);
    expect(principal).toEqual({
      userId: "user-1",
      tenantId: null,
      sessionId: created.session.id,
      tenantRoles: [],
      systemRoles: [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN],
    });
  });

  it("rejects system sessions for users without system_admin", async () => {
    const fixture = createFixture({ systemRoles: [] });
    const created = await fixture.service.createSystemSession({ userId: "user-1" });

    await expect(fixture.service.validateSystemSession(created.token)).rejects.toMatchObject({
      reason: SESSION_VALIDATION_FAILURE.InactiveMembership,
    });
  });

  it("revokes sessions by id and token", async () => {
    const fixture = createFixture();
    const first = await fixture.service.createSession({ userId: "user-1", tenantId: "tenant-1" });
    const second = await fixture.service.createSession({ userId: "user-1", tenantId: "tenant-1" });

    await fixture.service.revokeSession(first.session.id);
    await fixture.service.revokeToken(second.token);

    expect(first.session.revokedAt).toBeInstanceOf(Date);
    expect(second.session.revokedAt).toBeInstanceOf(Date);
  });
});

describe("session cookie helpers", () => {
  it("sets, reads, and clears the HTTP-only session cookie", () => {
    const fixture = createFixture();
    const response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    fixture.sessionCookies.setSessionCookie(response, "sid", "raw-token", { maxAgeSeconds: 3600 });
    fixture.sessionCookies.clearSessionCookie(response, "sid");

    expect(response.cookie).toHaveBeenCalledWith(
      "sid",
      "raw-token",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 3_600_000,
        path: "/",
      }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "sid",
      expect.objectContaining({ httpOnly: true, maxAge: 0, path: "/" }),
    );
    expect(
      fixture.sessionCookies.parseCookie(
        { headers: { cookie: "other=1; sid=raw-token" } } as Request,
        "sid",
      ),
    ).toBe("raw-token");
  });

  it("usa dominio raiz apenas para cookies seguros fora de localhost", () => {
    const fixture = createFixture();
    vi.spyOn(fixture.config, "getOrThrow").mockImplementation((key: string) => {
      if (key === "NODE_ENV") return "production";
      if (key === "ROOT_DOMAIN") return "pongping.example";
      return (fixture.config as any).getOrThrow(key);
    });

    const response = {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as Response;

    fixture.sessionCookies.setSessionCookie(response, "sid", "raw-token", { maxAgeSeconds: 3600 });
    fixture.sessionCookies.clearSessionCookie(response, "sid");

    expect(fixture.sessionCookies.getCookieDomain()).toBe(".pongping.example");
    expect(
      new SessionCookieService(fakeConfigWithDomain("localhost.me", "test")).getCookieDomain(),
    ).toBe(".localhost.me");
    expect(
      new SessionCookieService(fakeConfigWithDomain("localhost", "production")).getCookieDomain(),
    ).toBeUndefined();
    expect(
      new SessionCookieService(fakeConfigWithDomain("localhost", "test")).getCookieDomain(),
    ).toBeUndefined();

    expect(response.cookie).toHaveBeenCalledWith(
      "sid",
      "raw-token",
      expect.objectContaining({ domain: ".pongping.example", secure: true }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "sid",
      expect.objectContaining({ domain: ".pongping.example", secure: true }),
    );
  });
});

function fakeConfigWithDomain(domain: string, env: string): ConfigService<ConfigSchema> {
  const values: Record<string, any> = {
    SESSION_SECRET: "unit-test-session-secret",
    SESSION_COOKIE_NAME: "sid",
    SESSION_TTL_SECONDS: 3600,
    NODE_ENV: env,
    ROOT_DOMAIN: domain,
  };

  return {
    getOrThrow: (key: string) => {
      if (key in values) return values[key];
      throw new Error(`Missing config key ${key}`);
    },
  } as unknown as ConfigService<ConfigSchema>;
}
describe("SessionMiddleware", () => {
  it("lets public tenant OAuth routes restart when a stale tenant cookie is present", async () => {
    const context = new FakeContext();
    const sessions = {
      validateSystemSession: vi
        .fn()
        .mockRejectedValue(new SessionValidationError(SESSION_VALIDATION_FAILURE.TenantMismatch)),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("missing") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use(
      {
        path: "/v1/auth/google",
        url: "/v1/auth/google?tenant=teste&returnTo=%2Fclub",
        headers: { host: "localhost:3001", cookie: "sid=raw-token" },
      } as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect(sessions.validateSystemSession).not.toHaveBeenCalled();
  });

  it("writes the validated principal to context when a cookie is present", async () => {
    const context = new FakeContext();
    context.setTenant({ id: "tenant-1", slug: "acme" });
    const principal: IdentityPrincipal = {
      userId: "user-1",
      tenantId: "tenant-1",
      sessionId: "session-1",
      tenantRoles: [IDENTITY_TENANT_ROLE.ADMIN],
      systemRoles: [],
    };
    const sessions = {
      validateTenantSession: vi.fn().mockResolvedValue(principal),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("resolved") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use({ headers: { cookie: "sid_acme=raw-token" } } as Request, {} as Response, next);

    expect(sessions.validateTenantSession).toHaveBeenCalledWith("raw-token", "tenant-1");
    expect(context.principal).toEqual(principal);
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects invalid sessions from the service", async () => {
    const context = new FakeContext();
    context.setTenant({ id: "tenant-1", slug: "acme" });
    const sessions = {
      validateTenantSession: vi
        .fn()
        .mockRejectedValue(new SessionValidationError(SESSION_VALIDATION_FAILURE.Unknown)),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("resolved") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use({ headers: { cookie: "sid_acme=raw-token" } } as Request, {} as Response, next);

    expect(next.mock.calls[0]?.[0]?.getStatus()).toBe(401);
  });

  it("lets public system OAuth routes restart when a stale system cookie is present", async () => {
    const context = new FakeContext();
    const sessions = {
      validateSystemSession: vi
        .fn()
        .mockRejectedValue(new SessionValidationError(SESSION_VALIDATION_FAILURE.Expired)),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("reserved") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use(
      {
        path: "/v1/system/auth/google",
        url: "/v1/system/auth/google",
        headers: { host: "api.example.test", cookie: "sid=raw-token" },
      } as Request,
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it("validates system sessions on root or reserved hosts", async () => {
    const context = new FakeContext();
    const principal: IdentityPrincipal = {
      userId: "user-1",
      tenantId: null,
      sessionId: "session-1",
      tenantRoles: [],
      systemRoles: [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN],
    };
    const sessions = {
      validateSystemSession: vi.fn().mockResolvedValue(principal),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("reserved") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use(
      { headers: { host: "api.example.test", cookie: "sid_system=raw-token" } } as Request,
      {} as Response,
      next,
    );

    expect(sessions.validateSystemSession).toHaveBeenCalledWith("raw-token");
    expect(context.principal).toEqual(principal);
    expect(next).toHaveBeenCalledWith();
  });

  it("does not validate cookies without tenant context on tenant hosts", async () => {
    const context = new FakeContext();
    const sessions = {
      validateSystemSession: vi.fn(),
    };
    const middleware = new SessionMiddleware(
      fakeConfig(),
      context as never,
      sessions as never,
      tenantResolver("resolved") as never,
      new SessionCookieService(fakeConfig()),
    );
    const next = vi.fn();

    await middleware.use(
      { headers: { host: "acme.example.test", cookie: "sid=raw-token" } } as Request,
      {} as Response,
      next,
    );

    expect(sessions.validateSystemSession).not.toHaveBeenCalled();
    expect(context.principal).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});

class FakeContext {
  tenant?: TenantContext;
  principal?: IdentityPrincipal;

  getTenant(): TenantContext | undefined {
    return this.tenant;
  }

  setTenant(tenant: TenantContext): void {
    this.tenant = tenant;
  }

  setPrincipal(principal: IdentityPrincipal): void {
    this.principal = principal;
  }
}

class FakeSessionRepository {
  readonly records: IdentitySessionEntity[] = [];
  readonly saved: IdentitySessionEntity[] = [];
  private nextId = 1;

  create(input: Partial<IdentitySessionEntity>): IdentitySessionEntity {
    const tenantId = input.tenantId ?? null;
    return Object.assign(new IdentitySessionEntity(), {
      id: `session-${this.nextId++}`,
      ...input,
      user: activeUser(),
      tenant: tenantId === null ? null : activeTenant(),
    });
  }

  async save(session: IdentitySessionEntity): Promise<IdentitySessionEntity> {
    if (!this.records.includes(session)) this.records.push(session);
    this.saved.push(session);
    return session;
  }

  async findOne(
    options: FindOneOptions<IdentitySessionEntity>,
  ): Promise<IdentitySessionEntity | null> {
    const where = options.where as FindOptionsWhere<IdentitySessionEntity>;
    return this.records.find((session) => session.tokenHash === where.tokenHash) ?? null;
  }

  async update(
    where: FindOptionsWhere<IdentitySessionEntity>,
    patch: Partial<IdentitySessionEntity>,
  ): Promise<void> {
    for (const session of this.records) {
      if (where.id && session.id !== where.id) continue;
      if (where.tokenHash && session.tokenHash !== where.tokenHash) continue;
      if (session.revokedAt) continue;
      Object.assign(session, patch);
    }
  }
}

class FakeMembershipRepository {
  readonly records: TenantMembershipEntity[] = [
    Object.assign(new TenantMembershipEntity(), {
      userId: "user-1",
      tenantId: "tenant-1",
      roles: [IDENTITY_TENANT_ROLE.ADMIN],
      active: true,
    }),
  ];

  async findOne(
    options: FindOneOptions<TenantMembershipEntity>,
  ): Promise<TenantMembershipEntity | null> {
    const where = options.where as FindOptionsWhere<TenantMembershipEntity>;
    return (
      this.records.find(
        (membership) =>
          membership.userId === where.userId &&
          membership.tenantId === where.tenantId &&
          membership.active === where.active,
      ) ?? null
    );
  }
}

class FakeSystemRoleRepository {
  constructor(
    private readonly records: SystemRoleAssignmentEntity[] = [
      Object.assign(new SystemRoleAssignmentEntity(), {
        userId: "user-1",
        role: IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN,
      }),
    ],
  ) {}

  async find(): Promise<SystemRoleAssignmentEntity[]> {
    return this.records;
  }
}

function createFixture(options: { systemRoles?: SystemRoleAssignmentEntity[] } = {}) {
  const config = fakeConfig();
  const sessions = new FakeSessionRepository();
  const memberships = new FakeMembershipRepository();
  const service = new SessionService(
    config,
    sessions as unknown as Repository<IdentitySessionEntity>,
    {} as Repository<IdentityUserEntity>,
    memberships as unknown as Repository<TenantMembershipEntity>,
    new FakeSystemRoleRepository(
      options.systemRoles,
    ) as unknown as Repository<SystemRoleAssignmentEntity>,
  );
  const sessionCookies = new SessionCookieService(config);

  return { service, sessions, memberships, sessionCookies, config };
}

function tenantResolver(status: "missing" | "reserved" | "resolved") {
  return {
    parseHost: vi.fn(() => (status === "resolved" ? { status, slug: "acme" } : { status })),
  };
}

function fakeConfig(): ConfigService<ConfigSchema> {
  const values: Record<string, any> = {
    SESSION_SECRET: "unit-test-session-secret",
    SESSION_COOKIE_NAME: "sid",
    SESSION_TTL_SECONDS: 3600,
    NODE_ENV: "test",
    ROOT_DOMAIN: "localhost",
  };

  return {
    getOrThrow: (key: string) => {
      if (key in values) return values[key];
      throw new Error(`Missing config key ${key}`);
    },
    get: (key: string) => values[key],
  } as unknown as ConfigService<ConfigSchema>;
}

function activeUser(): IdentityUserEntity {
  return Object.assign(new IdentityUserEntity(), {
    id: "user-1",
    active: true,
  });
}

function activeTenant(): TenantEntity {
  return Object.assign(new TenantEntity(), {
    id: "tenant-1",
    slug: "acme",
    active: true,
  });
}
