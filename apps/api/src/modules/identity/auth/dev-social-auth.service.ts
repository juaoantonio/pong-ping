import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type {
  ConfigSchema,
  SocialAuthDevUserConfig,
} from "../../../common/config/config.module";
import { TenantEntity } from "../entities";
import type { GoogleProfile } from "./google-profile";

type SocialAuthProvider = SocialAuthDevUserConfig["provider"];

@Injectable()
export class DevSocialAuthService {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {}

  public getGoogleProfile(alias: string | undefined): GoogleProfile {
    const user = this.resolveUser("google", alias);

    return {
      googleSubject: user.subject,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  public async resolveTenant(rawTenant: unknown): Promise<TenantEntity> {
    const slug = firstString(rawTenant)?.toLowerCase();
    if (!slug || !/^[a-z0-9][a-z0-9-]{0,62}$/.test(slug)) {
      throw new BadRequestException("Tenant is required for dev social login.");
    }

    const reservedSubdomains = this.config.getOrThrow<string[]>("RESERVED_TENANT_SUBDOMAINS");
    if (reservedSubdomains.includes(slug)) {
      throw new BadRequestException("Tenant is reserved.");
    }

    const tenant = await this.tenants.findOne({ where: { slug } });
    if (!tenant || !tenant.active) {
      throw new BadRequestException("Tenant is invalid.");
    }

    return tenant;
  }

  private resolveUser(
    provider: SocialAuthProvider,
    alias: string | undefined,
  ): SocialAuthDevUserConfig {
    this.assertDevBypassEnabled();
    const users = this.config.getOrThrow<SocialAuthDevUserConfig[]>("SOCIAL_AUTH_DEV_USERS");
    const providerUsers = users.filter((user) => user.provider === provider);
    if (providerUsers.length === 0) {
      throw new BadRequestException("No dev social auth users are configured for this provider.");
    }

    const selectedAlias = alias?.trim();
    const user = selectedAlias
      ? providerUsers.find((candidate) => candidate.alias === selectedAlias)
      : providerUsers.find((candidate) => candidate.default) ?? providerUsers[0];

    if (!user) {
      throw new BadRequestException("Dev social auth user is invalid.");
    }
    if (selectedAlias && user.alias !== selectedAlias) {
      throw new BadRequestException("Dev social auth user was not found.");
    }

    return user;
  }

  private assertDevBypassEnabled(): void {
    if (this.config.getOrThrow<string>("NODE_ENV") !== "development") {
      throw new ForbiddenException("Dev social auth bypass is only available in development.");
    }
    if (!this.config.getOrThrow<boolean>("SOCIAL_AUTH_DEV_BYPASS_ENABLED")) {
      throw new ForbiddenException("Dev social auth bypass is disabled.");
    }
  }
}

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim();
  return undefined;
}
