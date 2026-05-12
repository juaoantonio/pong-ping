import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Request, Response } from "express";
import type { ConfigSchema } from "../../../common/config/config.module";
import { CurrentContextService } from "../../../common/context";
import { TenantResolver } from "../tenancy/tenant.resolver";
import { readCookie } from "./cookies";
import { SessionService } from "./session.service";
import { SessionValidationError } from "./session-validation.error";

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    private readonly context: CurrentContextService,
    private readonly sessions: SessionService,
    private readonly tenantResolver: TenantResolver,
  ) {}

  public async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    if (isPublicAuthPath(req)) {
      next();
      return;
    }

    const cookieName = this.config.getOrThrow<string>("SESSION_COOKIE_NAME");
    const rawToken = readCookie(req, cookieName);
    if (!rawToken) {
      next();
      return;
    }

    try {
      const tenant = this.context.getTenant();
      const principal = tenant
        ? await this.sessions.validateTenantSession(rawToken, tenant.id)
        : await this.validateSystemHostSession(req, rawToken);

      if (!principal) {
        next();
        return;
      }

      this.context.setPrincipal(principal);
      next();
    } catch (error) {
      if (error instanceof SessionValidationError) {
        next(new UnauthorizedException("Invalid session."));
        return;
      }

      next(error);
    }
  }

  private async validateSystemHostSession(req: Request, rawToken: string) {
    const host = req.headers.host;
    const hostResolution = this.tenantResolver.parseHost(host);
    if (hostResolution.status !== "missing" && hostResolution.status !== "reserved") {
      return undefined;
    }

    return this.sessions.validateSystemSession(rawToken);
  }
}

function isPublicAuthPath(req: Request): boolean {
  const path = req.path ?? req.url?.split("?")[0] ?? "";
  return (
    path.endsWith("/auth/google") ||
    path.endsWith("/auth/google/callback") ||
    path.endsWith("/system/auth/google") ||
    path.endsWith("/system/auth/google/callback")
  );
}
