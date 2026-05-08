import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CurrentContextService } from "../../../common/context";
import {
  IDENTITY_SYSTEM_ROLE,
  type IdentitySystemRole,
  type IdentityTenantRole,
} from "../identity-roles";
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
    const tenantRoles = this.reflector.getAllAndOverride<IdentityTenantRole[]>(
      TENANT_ROLES_KEY,
      targets,
    );
    if (tenantRoles?.length) {
      const tenant = this.context.getTenantOrThrow();
      if (
        principal.tenantId !== tenant.id ||
        !tenantRoles.some((role) => principal.tenantRoles.includes(role))
      ) {
        throw new ForbiddenException("Tenant role is required.");
      }

      return true;
    }

    const systemRoles = this.reflector.getAllAndOverride<IdentitySystemRole[]>(
      SYSTEM_ROLES_KEY,
      targets,
    ) ?? [IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN];
    if (!systemRoles.some((role) => principal.systemRoles.includes(role))) {
      throw new ForbiddenException("System role is required.");
    }

    return true;
  }
}
