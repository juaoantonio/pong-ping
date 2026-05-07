import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { ConfigSchema } from "../../../common/config/config.module";
import { TenantEntity } from "../entities";
import { parseTenantSlugFromHost, type TenantHostResolution } from "./tenant-host";

export type ActiveTenantResolution =
  | { status: "resolved"; tenant: TenantEntity }
  | { status: "missing" | "reserved" | "invalid_root" | "unknown" | "inactive" };

@Injectable()
export class TenantResolver {
  public constructor(
    private readonly config: ConfigService<ConfigSchema>,
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
  ) {}

  public async resolveFromHost(host: string | undefined): Promise<ActiveTenantResolution> {
    const hostResolution = this.parseHost(host);
    if (hostResolution.status !== "resolved") {
      return hostResolution;
    }

    const tenant = await this.tenants.findOne({ where: { slug: hostResolution.slug } });
    if (!tenant) {
      return { status: "unknown" };
    }

    if (!tenant.active) {
      return { status: "inactive" };
    }

    return { status: "resolved", tenant };
  }

  public parseHost(host: string | undefined): TenantHostResolution {
    return parseTenantSlugFromHost(
      host,
      this.config.getOrThrow<string>("ROOT_DOMAIN"),
      this.config.getOrThrow<string[]>("RESERVED_TENANT_SUBDOMAINS"),
    );
  }
}
