import { ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { IAuthModuleOptions } from "@nestjs/passport";
import type { Request } from "express";
import type { ConfigSchema } from "../../../common/config/config.module";
import { CurrentContextService } from "../../../common/context";

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  public constructor(
    private readonly context: CurrentContextService,
    private readonly config: ConfigService<ConfigSchema>,
  ) {
    super();
  }

  public override canActivate(context: ExecutionContext) {
    this.context.getTenantOrThrow();
    return super.canActivate(context);
  }

  public override getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const request = context.switchToHttp().getRequest<Request>();
    return {
      callbackURL: this.buildCallbackUrl(request),
    };
  }

  private buildCallbackUrl(request: Request): string {
    const configuredCallback = new URL(this.config.getOrThrow<string>("GOOGLE_CALLBACK_URL"));
    const host = request.headers["x-forwarded-host"]?.toString() ?? request.headers.host;
    const protocol = request.headers["x-forwarded-proto"]?.toString() ?? request.protocol;
    const prefix = this.config.getOrThrow<string>("API_PREFIX").replace(/^\/|\/$/g, "");

    if (host) {
      configuredCallback.host = host.split(",")[0]?.trim() ?? configuredCallback.host;
    }
    configuredCallback.protocol = `${protocol.split(",")[0]?.trim() ?? configuredCallback.protocol}:`;
    configuredCallback.pathname = prefix ? `/${prefix}/auth/google/callback` : "/auth/google/callback";
    configuredCallback.search = "";
    configuredCallback.hash = "";

    return configuredCallback.toString();
  }
}
