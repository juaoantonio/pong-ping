import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard } from "@nestjs/passport";
import type { IAuthModuleOptions } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { isObservable, lastValueFrom } from "rxjs";
import { Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import { TenantEntity } from "../entities";
import { OAuthStateService, validateInternalReturnTo } from "./oauth-state.service";

type RequestWithOAuthState = Request & {
  tenantOAuthState?: string;
};

@Injectable()
export class GoogleOAuthGuard extends AuthGuard("google") {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    private readonly oauthState: OAuthStateService,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {
    super();
  }

  public override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithOAuthState>();
    if (isCallbackRequest(request)) {
      this.assertAuthHost(request);
    } else {
      await this.prepareTenantOAuthStart(request);
    }

    const result = super.canActivate(context);
    return isObservable(result) ? lastValueFrom(result) : result;
  }

  public async prepareTenantOAuthStart(request: RequestWithOAuthState): Promise<void> {
    this.assertAuthHost(request);
    const tenant = await this.resolveTenant(request.query.tenant);
    const returnTo = validateInternalReturnTo(firstString(request.query.returnTo));
    request.tenantOAuthState = this.oauthState.createTenantState({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      returnTo,
    });
  }

  public override getAuthenticateOptions(context: ExecutionContext): IAuthModuleOptions {
    const request = context.switchToHttp().getRequest<RequestWithOAuthState>();
    return {
      callbackURL: this.config.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
      ...(request.tenantOAuthState ? { state: request.tenantOAuthState } : {}),
    };
  }

  private assertAuthHost(request: Request): void {
    const host = normalizeHost(
      request.headers["x-forwarded-host"]?.toString() ?? request.headers.host,
    );
    const configuredHost = new URL(this.config.getOrThrow<string>("AUTH_BASE_URL")).hostname;

    if (host !== configuredHost) {
      throw new ForbiddenException("Tenant OAuth must start on the central auth host.");
    }
  }

  private async resolveTenant(rawTenant: unknown): Promise<TenantEntity> {
    const slug = firstString(rawTenant)?.toLowerCase();
    if (!slug || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) {
      throw new BadRequestException("Tenant is required for Google login.");
    }

    const reservedSubdomains = this.config.getOrThrow<string[]>("RESERVED_TENANT_SUBDOMAINS");
    if (reservedSubdomains.includes(slug.toLowerCase())) {
      throw new BadRequestException("Tenant is reserved.");
    }

    const tenant = await this.tenants.findOne({ where: { slug: slug.toLowerCase() } });
    if (!tenant || !tenant.active) {
      throw new BadRequestException("Tenant is invalid.");
    }

    return tenant;
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  return undefined;
}

function isCallbackRequest(request: Request): boolean {
  return (
    request.path?.endsWith("/auth/google/callback") ||
    request.url?.includes("/auth/google/callback")
  );
}

function normalizeHost(host: string | undefined): string | undefined {
  return host
    ?.split(",")[0]
    ?.trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .split("/")[0]
    ?.toLowerCase()
    .replace(/:\d+$/, "");
}
