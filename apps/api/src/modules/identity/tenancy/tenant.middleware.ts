import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { CurrentContextService } from "../../../common/context";
import { TenantResolver } from "./tenant.resolver";

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  public constructor(
    private readonly tenantResolver: TenantResolver,
    private readonly context: CurrentContextService,
  ) {}

  public async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      const host = req.headers["x-forwarded-host"]?.toString() ?? req.headers.host;
      const hostResolution = await this.tenantResolver.resolveFromHost(host);
      const resolution =
        hostResolution.status === "missing" || hostResolution.status === "reserved"
          ? await this.resolveFromOriginOrHost(req, hostResolution)
          : hostResolution;

      if (resolution.status !== "resolved") {
        next();
        return;
      }

      assertClientTenantInputMatchesHost(req, {
        tenantId: resolution.tenant.id,
        tenantSlug: resolution.tenant.slug,
      });

      this.context.setTenant({ id: resolution.tenant.id, slug: resolution.tenant.slug });
      next();
    } catch (error) {
      next(error);
    }
  }

  private async resolveFromOriginOrHost(
    req: Request,
    hostResolution: Awaited<ReturnType<TenantResolver["resolveFromHost"]>>,
  ) {
    const origin = firstString(req.headers.origin);
    if (!origin) return hostResolution;

    const originResolution = await this.tenantResolver.resolveFromHost(origin);
    return originResolution.status === "resolved" ? originResolution : hostResolution;
  }
}

function assertClientTenantInputMatchesHost(
  request: Request,
  resolved: { tenantId: string; tenantSlug: string },
): void {
  const tenantIds = [
    firstString(request.headers["x-tenant-id"]),
    firstString(request.query.tenantId),
    firstString(request.query.tenant_id),
    firstString(request.body?.tenantId),
    firstString(request.body?.tenant_id),
  ].filter((value): value is string => Boolean(value));

  const tenantSlugs = [
    firstString(request.headers["x-tenant-slug"]),
    firstString(request.query.tenantSlug),
    firstString(request.query.tenant_slug),
    firstString(request.body?.tenantSlug),
    firstString(request.body?.tenant_slug),
  ].filter((value): value is string => Boolean(value));

  if (tenantIds.some((tenantId) => tenantId !== resolved.tenantId)) {
    throw new ForbiddenException("Client-supplied tenant id does not match host tenant.");
  }

  if (tenantSlugs.some((tenantSlug) => tenantSlug.toLowerCase() !== resolved.tenantSlug)) {
    throw new ForbiddenException("Client-supplied tenant slug does not match host tenant.");
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstString(value[0]);
  return undefined;
}
