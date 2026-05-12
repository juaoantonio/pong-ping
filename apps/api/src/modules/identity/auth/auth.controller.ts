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
import { Public, RequireTenantRoles } from "../authorization/authorization.decorators";
import { TENANT_ROLES } from "../identity-roles";
import { clearSessionCookie, setSessionCookie } from "../session/cookies";
import { SessionService } from "../session/session.service";
import { AuthService } from "./auth.service";
import { AuthLogoutResponseDto, IdentityPrincipalResponseDto } from "./dtos/auth-response.dtos";
import { GoogleOAuthGuard } from "./google-oauth.guard";
import type { GoogleProfile } from "./google-profile";
import { OAuthStateService } from "./oauth-state.service";
import { buildTenantFrontendRedirectUrl } from "./tenant-redirect";

@ApiTags("tenant auth")
@Controller("auth")
export class AuthController {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    private readonly auth: AuthService,
    private readonly context: CurrentContextService,
    private readonly sessions: SessionService,
    private readonly oauthState: OAuthStateService,
  ) {}

  @Get("google")
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: "Start tenant Google login",
    description: "Redirects the browser to Google OAuth from the central tenant auth host.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: "Redirect to Google OAuth.",
  })
  @ApiErrorEnvelopeResponses({
    status: HttpStatus.FORBIDDEN,
    description: "Tenant host is missing, invalid, or inactive.",
  })
  public googleStart(): void {
    return undefined;
  }

  @Get("google/callback")
  @Public()
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: "Complete tenant Google login",
    description:
      "Creates a tenant session, sets the session cookie, and redirects to the club frontend.",
  })
  @ApiResponse({
    status: HttpStatus.FOUND,
    description: "Tenant session created and redirected to the club frontend.",
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.BAD_REQUEST,
      description: "Invalid OAuth callback request.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "User is not a member of the current tenant.",
    },
    {
      status: HttpStatus.CONFLICT,
      description: "Email is already linked to another Google account.",
    },
  )
  public async googleCallback(@Req() req: Request, @Res() res: Response) {
    const validatedState = await this.oauthState.validateTenantState(firstString(req.query.state));
    const created = await this.auth.completeGoogleLoginForTenant(
      req.user as GoogleProfile,
      validatedState.tenant,
      {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    );
    const secure = this.config.getOrThrow<string>("NODE_ENV") === "production";

    setSessionCookie(
      res,
      this.config.getOrThrow<string>("SESSION_COOKIE_NAME"),
      created.token,
      this.config.getOrThrow<number>("SESSION_TTL_SECONDS"),
      {
        secure,
        rootDomain: this.config.getOrThrow<string>("ROOT_DOMAIN"),
      },
    );

    return res.redirect(
      buildTenantFrontendRedirectUrl({
        tenantFrontendUrl: this.config.getOrThrow<string>("TENANT_FRONTEND_URL"),
        rootDomain: this.config.getOrThrow<string>("ROOT_DOMAIN"),
        tenantSlug: validatedState.payload.tenantSlug,
        returnTo: validatedState.payload.returnTo,
      }),
    );
  }

  @Post("logout")
  @RequireTenantRoles(...TENANT_ROLES)
  @ApiOperation({
    summary: "Log out of the current tenant session",
    description: "Requires a valid tenant session cookie with any tenant role.",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.CREATED,
    description: "Tenant session revoked and cookie cleared.",
    data: AuthLogoutResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "Current principal does not have a tenant role.",
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
  @RequireTenantRoles(...TENANT_ROLES)
  @ApiOperation({
    summary: "Get the current tenant principal",
    description: "Requires a valid tenant session cookie with any tenant role.",
  })
  @ApiSuccessEnvelopeResponse({
    status: HttpStatus.OK,
    description: "Current tenant principal.",
    data: IdentityPrincipalResponseDto,
  })
  @ApiErrorEnvelopeResponses(
    {
      status: HttpStatus.UNAUTHORIZED,
      description: "Missing or invalid session cookie.",
    },
    {
      status: HttpStatus.FORBIDDEN,
      description: "Current principal does not have a tenant role.",
    },
  )
  public me() {
    return this.auth.getMe();
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}
