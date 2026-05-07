import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ClsService } from "nestjs-cls";
import type { IdentityPrincipal, IdentityRequestContext, TenantContext } from "./request-context.types";

@Injectable()
export class CurrentContextService {
  constructor(private readonly cls: ClsService<IdentityRequestContext>) {}

  getTenant(): TenantContext | undefined {
    return this.cls.get("tenant");
  }

  getTenantOrThrow(): TenantContext {
    const tenant = this.getTenant();
    if (!tenant) throw new ForbiddenException("Tenant context is required.");
    return tenant;
  }

  setTenant(tenant: TenantContext): void {
    this.cls.set("tenant", tenant);
  }

  getPrincipal(): IdentityPrincipal | undefined {
    return this.cls.get("principal");
  }

  getPrincipalOrThrow(): IdentityPrincipal {
    const principal = this.getPrincipal();
    if (!principal) throw new UnauthorizedException("Identity principal is required.");
    return principal;
  }

  setPrincipal(principal: IdentityPrincipal): void {
    this.cls.set("principal", principal);
  }
}
