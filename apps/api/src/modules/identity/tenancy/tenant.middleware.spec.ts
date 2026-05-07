import { ForbiddenException } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import type { TenantContext } from "../../../common/context";
import { TenantEntity } from "../entities";
import type { ActiveTenantResolution, TenantResolver } from "./tenant.resolver";
import { TenantMiddleware } from "./tenant.middleware";

describe("TenantMiddleware", () => {
  it("writes resolved active tenant to request context", async () => {
    const context = new FakeContext();
    const middleware = createMiddleware({ status: "resolved", tenant: tenant("tenant-1", "acme") }, context);
    const next = vi.fn();

    await middleware.use(requestWithHost("acme.example.test"), {} as Response, next);

    expect(context.tenant).toEqual({ id: "tenant-1", slug: "acme" });
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ["missing", { status: "missing" }],
    ["reserved", { status: "reserved" }],
    ["unknown", { status: "unknown" }],
    ["inactive", { status: "inactive" }],
  ] as const)("leaves context empty for %s tenant resolution", async (_name, resolution) => {
    const context = new FakeContext();
    const middleware = createMiddleware(resolution, context);
    const next = vi.fn();

    await middleware.use(requestWithHost("acme.example.test"), {} as Response, next);

    expect(context.tenant).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it("rejects client-supplied tenant mismatch", async () => {
    const middleware = createMiddleware({ status: "resolved", tenant: tenant("tenant-1", "acme") });
    const next = vi.fn();

    await middleware.use(
      requestWithHost("acme.example.test", {
        headers: { "x-tenant-id": "tenant-2" },
        body: { tenantSlug: "other" },
      }),
      {} as Response,
      next,
    );

    expect(next.mock.calls[0]?.[0]).toBeInstanceOf(ForbiddenException);
  });
});

class FakeContext {
  tenant?: TenantContext;

  setTenant(tenant: TenantContext): void {
    this.tenant = tenant;
  }
}

function createMiddleware(
  resolution: ActiveTenantResolution,
  context = new FakeContext(),
): TenantMiddleware {
  return new TenantMiddleware(
    { resolveFromHost: vi.fn().mockResolvedValue(resolution) } as unknown as TenantResolver,
    context as never,
  );
}

function requestWithHost(
  host: string,
  overrides: { headers?: Record<string, string>; body?: Record<string, string> } = {},
): Request {
  return {
    headers: { host, ...overrides.headers },
    query: {},
    body: overrides.body ?? {},
  } as Request;
}

function tenant(id: string, slug: string): TenantEntity {
  return Object.assign(new TenantEntity(), { id, slug, active: true });
}
