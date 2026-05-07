import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NextFunction, Request, Response } from "express";
import type { ConfigSchema } from "../../../common/config/config.module";
import { CurrentContextService } from "../../../common/context";
import { readCookie } from "./cookies";
import { SessionService } from "./session.service";
import { SessionValidationError } from "./session-validation.error";

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    private readonly context: CurrentContextService,
    private readonly sessions: SessionService,
  ) {}

  public async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const tenant = this.context.getTenant();
    if (!tenant) {
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
      const principal = await this.sessions.validateSession(rawToken, tenant.id);
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
}
