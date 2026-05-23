import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RequestContextModule } from "../../common/context";
import { IdentityAuthorizationGuard } from "./authorization/identity-authorization.guard";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { DevSocialAuthService } from "./auth/dev-social-auth.service";
import { GoogleOAuthGuard } from "./auth/google-oauth.guard";
import { GoogleOAuthStrategy } from "./auth/google-oauth.strategy";
import { OAuthStateService } from "./auth/oauth-state.service";
import { IDENTITY_ENTITIES } from "./entities";
import { SessionMiddleware } from "./session/session.middleware";
import { SessionService } from "./session/session.service";
import { SessionCookieService } from "./session/session-cookie.service";
import {
  SystemAdminController,
  SystemAdminService,
  SystemAuthController,
  SystemGoogleOAuthGuard,
  SystemHostGuard,
} from "./system";
import { TenantMiddleware } from "./tenancy/tenant.middleware";
import { TenantResolver } from "./tenancy/tenant.resolver";

@Module({
  imports: [
    RequestContextModule,
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature(IDENTITY_ENTITIES),
  ],
  controllers: [AuthController, SystemAuthController, SystemAdminController],
  providers: [
    TenantResolver,
    SessionService,
    SessionCookieService,
    AuthService,
    DevSocialAuthService,
    OAuthStateService,
    SystemAdminService,
    SystemHostGuard,
    SystemGoogleOAuthGuard,
    GoogleOAuthGuard,
    GoogleOAuthStrategy,
    {
      provide: APP_GUARD,
      useClass: IdentityAuthorizationGuard,
    },
  ],
  exports: [AuthService, SessionService, SessionCookieService, TenantResolver, OAuthStateService],
})
export class IdentityModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware, SessionMiddleware).forRoutes("*");
  }
}
