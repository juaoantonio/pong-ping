import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { IAuthModuleOptions } from "@nestjs/passport";
import type { ConfigSchema } from "../../../common/config/config.module";

@Injectable()
export class SystemGoogleOAuthGuard extends AuthGuard("google") {
  public constructor(private readonly config: ConfigService<ConfigSchema>) {
    super();
  }

  public override getAuthenticateOptions(): IAuthModuleOptions {
    return {
      callbackURL: this.buildCallbackUrl(),
    };
  }

  private buildCallbackUrl(): string {
    const configuredCallback = new URL(this.config.getOrThrow<string>("GOOGLE_CALLBACK_URL"));
    const prefix = this.config.getOrThrow<string>("API_PREFIX").replace(/^\/|\/$/g, "");
    configuredCallback.pathname = prefix
      ? `/${prefix}/system/auth/google/callback`
      : "/system/auth/google/callback";
    configuredCallback.search = "";
    configuredCallback.hash = "";

    return configuredCallback.toString();
  }
}
