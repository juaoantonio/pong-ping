import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { TenantResolver } from "../tenancy/tenant.resolver";

@Injectable()
export class SystemHostGuard implements CanActivate {
  public constructor(private readonly tenantResolver: TenantResolver) {}

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!this.isSystemHost(request)) {
      throw new ForbiddenException("System routes are available only on root or reserved hosts.");
    }

    return true;
  }

  public isSystemHost(requestOrHost: Request | string | undefined): boolean {
    const host =
      typeof requestOrHost === "string" || requestOrHost === undefined
        ? requestOrHost
        : requestOrHost.headers.host;
    const resolution = this.tenantResolver.parseHost(host);
    return resolution.status === "missing" || resolution.status === "reserved";
  }
}
