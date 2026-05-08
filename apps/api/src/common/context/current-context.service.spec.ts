import { AsyncLocalStorage } from "node:async_hooks";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import { describe, expect, it } from "vitest";
import { IDENTITY_SYSTEM_ROLE } from "../../modules/identity/identity-roles";
import { CurrentContextService } from "./current-context.service";
import type {
  IdentityPrincipal,
  IdentityRequestContext,
  TenantContext,
} from "./request-context.types";

describe("CurrentContextService", () => {
  function createSubject() {
    const cls = new ClsService<IdentityRequestContext>(
      new AsyncLocalStorage<IdentityRequestContext>(),
    );
    const service = new CurrentContextService(cls);
    return { cls, service };
  }

  it("falha quando tenant nao esta no contexto", () => {
    const { cls, service } = createSubject();

    cls.run(() => {
      expect(() => service.getTenantOrThrow()).toThrow(ForbiddenException);
    });
  });

  it("retorna tenant presente no contexto", () => {
    const { cls, service } = createSubject();
    const tenant: TenantContext = { id: "tenant-1", slug: "pong" };

    cls.run(() => {
      service.setTenant(tenant);

      expect(service.getTenantOrThrow()).toEqual(tenant);
    });
  });

  it("retorna undefined para principal ausente", () => {
    const { cls, service } = createSubject();

    cls.run(() => {
      expect(service.getPrincipal()).toBeUndefined();
    });
  });

  it("falha quando principal obrigatorio nao esta no contexto", () => {
    const { cls, service } = createSubject();

    cls.run(() => {
      expect(() => service.getPrincipalOrThrow()).toThrow(UnauthorizedException);
    });
  });

  it("retorna principal presente no contexto", () => {
    const { cls, service } = createSubject();
    const principal: IdentityPrincipal = {
      userId: "user-1",
      tenantId: "tenant-1",
      sessionId: "session-1",
      systemRoles: [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN],
      tenantRoles: ["tenant_admin"],
    };

    cls.run(() => {
      service.setPrincipal(principal);

      expect(service.getPrincipal()).toEqual(principal);
      expect(service.getPrincipalOrThrow()).toEqual(principal);
    });
  });
});
