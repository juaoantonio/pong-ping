import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CurrentContextService } from "../../../common/context";
import type { SystemRole, TenantRole } from "../entities";
import { IS_PUBLIC_KEY, SYSTEM_ROLES_KEY, TENANT_ROLES_KEY } from "./authorization.decorators";

@Injectable()
export class IdentityAuthorizationGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly context: CurrentContextService,
  ) {}

  public canActivate(executionContext: ExecutionContext): boolean {
    const targets = [executionContext.getHandler(), executionContext.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    if (isPublic) {
      return true;
    }

    const principal = this.context.getPrincipalOrThrow();
    const tenantRoles = this.reflector.getAllAndOverride<TenantRole[]>(TENANT_ROLES_KEY, targets);
    if (tenantRoles?.length) {
      const tenant = this.context.getTenantOrThrow();
      if (principal.tenantId !== tenant.id || !tenantRoles.some((role) => principal.tenantRoles.includes(role))) {
        throw new ForbiddenException("Tenant role is required.");
      }

      return true;
    }

    const systemRoles =
      this.reflector.getAllAndOverride<SystemRole[]>(SYSTEM_ROLES_KEY, targets) ?? (["system_admin"] as SystemRole[]);
    if (!systemRoles.some((role) => principal.systemRoles.includes(role))) {
      throw new ForbiddenException("System role is required.");
    }

    return true;
  }
}
