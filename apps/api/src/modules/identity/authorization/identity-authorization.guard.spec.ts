import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";
import { CurrentContextService } from "../../../common/context";
import { IS_PUBLIC_KEY, SYSTEM_ROLES_KEY, TENANT_ROLES_KEY } from "./authorization.decorators";
import { IdentityAuthorizationGuard } from "./identity-authorization.guard";

function context(): ExecutionContext {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
  } as unknown as ExecutionContext;
}

function reflector(metadata: Record<string, unknown>) {
  return {
    getAllAndOverride: vi.fn((key: string) => metadata[key]),
  } as unknown as Reflector;
}

function currentContext(partial: Partial<CurrentContextService>): CurrentContextService {
  return partial as unknown as CurrentContextService;
}

describe("IdentityAuthorizationGuard", () => {
  it("libera rota publica", () => {
    const guard = new IdentityAuthorizationGuard(
      reflector({ [IS_PUBLIC_KEY]: true }),
      currentContext({}),
    );

    expect(guard.canActivate(context())).toBe(true);
  });

  it("rota sem metadata exige system_admin", () => {
    const guard = new IdentityAuthorizationGuard(reflector({}), currentContext({
      getPrincipalOrThrow: () => ({
        userId: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
        tenantRoles: [],
        systemRoles: ["system_admin"],
      }),
    }));

    expect(guard.canActivate(context())).toBe(true);
  });

  it("nega rota sem metadata para usuario sem system_admin", () => {
    const guard = new IdentityAuthorizationGuard(reflector({}), currentContext({
      getPrincipalOrThrow: () => ({
        userId: "user-1",
        tenantId: "tenant-1",
        sessionId: "session-1",
        tenantRoles: ["owner"],
        systemRoles: [],
      }),
    }));

    expect(() => guard.canActivate(context())).toThrow();
  });

  it("usa system roles explicitas quando declaradas", () => {
    const guard = new IdentityAuthorizationGuard(
      reflector({ [SYSTEM_ROLES_KEY]: ["system_admin"] }),
      currentContext({
        getPrincipalOrThrow: () => ({
          userId: "user-1",
          tenantId: "tenant-1",
          sessionId: "session-1",
          tenantRoles: [],
          systemRoles: ["system_admin"],
        }),
      }),
    );

    expect(guard.canActivate(context())).toBe(true);
  });

  it("exige roles de tenant quando declaradas", () => {
    const guard = new IdentityAuthorizationGuard(
      reflector({ [TENANT_ROLES_KEY]: ["owner"] }),
      currentContext({
        getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }),
        getPrincipalOrThrow: () => ({
          userId: "user-1",
          tenantId: "tenant-1",
          sessionId: "session-1",
          tenantRoles: ["owner"],
          systemRoles: [],
        }),
      }),
    );

    expect(guard.canActivate(context())).toBe(true);
  });

  it("nega tenant role incorreta", () => {
    const guard = new IdentityAuthorizationGuard(
      reflector({ [TENANT_ROLES_KEY]: ["admin"] }),
      currentContext({
        getTenantOrThrow: () => ({ id: "tenant-1", slug: "acme" }),
        getPrincipalOrThrow: () => ({
          userId: "user-1",
          tenantId: "tenant-1",
          sessionId: "session-1",
          tenantRoles: ["member"],
          systemRoles: [],
        }),
      }),
    );

    expect(() => guard.canActivate(context())).toThrow();
  });

  it("propaga unauthenticated quando nao ha principal", () => {
    const guard = new IdentityAuthorizationGuard(
      reflector({ [SYSTEM_ROLES_KEY]: ["system_admin"] }),
      currentContext({
        getPrincipalOrThrow: () => {
          throw new UnauthorizedException();
        },
      }),
    );

    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
  });
});
