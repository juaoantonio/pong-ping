import { Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import type { ConfigSchema } from "../../../common/config/config.module";
import { CurrentContextService } from "../../../common/context";
import {
  ApiErrorEnvelopeResponses,
  ApiSuccessEnvelopeResponse,
} from "../../../common/shared/http/api-response.swagger";
import { Public, RequireSystemRoles } from "../authorization/authorization.decorators";
import { AuthService } from "../auth/auth.service";
import {
  AuthLogoutResponseDto,
  IdentityPrincipalResponseDto,
} from "../auth/dtos/auth-response.dtos";
import type { GoogleProfile } from "../auth/google-profile";
import { IDENTITY_SYSTEM_ROLE } from "../identity-roles";
import { clearSessionCookie, setSessionCookie } from "../session/cookies";
import { SessionService } from "../session/session.service";
import { SystemGoogleOAuthGuard } from "./system-google-oauth.guard";
import { SystemHostGuard } from "./system-host.guard";

@ApiTags("system auth")
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
  @ApiOperation({
    summary: "Start system Google login",
    description: "Redirects the browser to Google OAuth. Only available on the system host.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: "Redirect to Google OAuth.",
  })
  @ApiErrorEnvelopeResponses({
    status: HttpStatus.FORBIDDEN,
    description: "Request is not using the configured system host.",
  })
  public googleStart(): void {
    return undefined;
  }

  @Get("google/callback")
  @Public()
  @UseGuards(SystemHostGuard, SystemGoogleOAuthGuard)
  @ApiOperation({
    summary: "Complete system Google login",
    description:
      "Creates a system administrator session, sets the session cookie, and redirects to the system admin frontend.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: "System administrator session created and redirected to the frontend.",
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Invalid OAuth callback request.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
    {
      status: HttpStatus.CONFLICT,
      description: "Email is already linked to another Google account.",
    },
  )
  public async googleCallback(@Req() req: Request, @Res() res: Response) {
    const created = await this.auth.completeSystemGoogleLogin(req.user as GoogleProfile, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    setSessionCookie(
      res,
      this.config.getOrThrow<string>("SESSION_COOKIE_NAME"),
      created.token,
      this.config.getOrThrow<number>("SESSION_TTL_SECONDS"),
      {
        secure: this.config.getOrThrow<string>("NODE_ENV") === "production",
        rootDomain: this.config.getOrThrow<string>("ROOT_DOMAIN"),
      },
    );

    return res.redirect(this.config.getOrThrow<string>("SYSTEM_ADMIN_FRONTEND_URL"));
  }

  @Post("logout")
  @RequireSystemRoles(IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)
  @ApiOperation({
    summary: "Log out of the current system session",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "System session revoked and cookie cleared.",
    data: AuthLogoutResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
  )
  public async logout(@Res({ passthrough: true }) res: Response) {
    const principal = this.context.getPrincipalOrThrow();
    await this.sessions.revokeSession(principal.sessionId);
    clearSessionCookie(res, this.config.getOrThrow<string>("SESSION_COOKIE_NAME"), {
      secure: this.config.getOrThrow<string>("NODE_ENV") === "production",
      rootDomain: this.config.getOrThrow<string>("ROOT_DOMAIN"),
    });

    return { revoked: true };
  }

  @Get("me")
  @RequireSystemRoles(IDENTITY_SYSTEM_ROLE.SYSTEM_ADMIN)
  @ApiOperation({
    summary: "Get the current system principal",
    description: "Requires a valid session cookie with the system administrator role.",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Current system principal.",
    data: IdentityPrincipalResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "System host or system administrator role is required.",
    },
  )
  public me() {
    return this.auth.getMe();
  }
}
