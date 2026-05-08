import { Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import type { ConfigSchema } from "../../../common/config/config.module";
import { CurrentContextService } from "../../../common/context";
import { Public, RequireSystemRoles } from "../authorization/authorization.decorators";
import { AuthService } from "../auth/auth.service";
import type { GoogleProfile } from "../auth/google-profile";
import { clearSessionCookie, setSessionCookie } from "../session/cookies";
import { SessionService } from "../session/session.service";
import { SystemGoogleOAuthGuard } from "./system-google-oauth.guard";
import { SystemHostGuard } from "./system-host.guard";

@Controller("system/auth")
@UseGuards(SystemHostGuard)
export class SystemAuthController {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    private readonly auth: AuthService,
    private readonly context: CurrentContextService,
    private readonly sessions: SessionService,
  ) {}

  @Get("google")
  @Public()
  @UseGuards(SystemHostGuard, SystemGoogleOAuthGuard)
  public googleStart(): void {
    return undefined;
  }

  @Get("google/callback")
  @Public()
  @UseGuards(SystemHostGuard, SystemGoogleOAuthGuard)
  public async googleCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const created = await this.auth.completeSystemGoogleLogin(req.user as GoogleProfile, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setSessionCookie(
      res,
      this.config.getOrThrow<string>("SESSION_COOKIE_NAME"),
      created.token,
      this.config.getOrThrow<number>("SESSION_TTL_SECONDS"),
      this.config.getOrThrow<string>("NODE_ENV") === "production",
    );

    return { sessionId: created.session.id };
  }

  @Post("logout")
  @RequireSystemRoles("system_admin")
  public async logout(@Res({ passthrough: true }) res: Response) {
    const principal = this.context.getPrincipalOrThrow();
    await this.sessions.revokeSession(principal.sessionId);
    clearSessionCookie(
      res,
      this.config.getOrThrow<string>("SESSION_COOKIE_NAME"),
      this.config.getOrThrow<string>("NODE_ENV") === "production",
    );

    return { revoked: true };
  }

  @Get("me")
  @RequireSystemRoles("system_admin")
  public me() {
    return this.auth.getMe();
  }
}
