import { ForbiddenException, Injectable } from "@nestjs/common";
import { ClsService, type ClsStore } from "nestjs-cls";

export type TenantScopeContext = {
  tenantId: string;
  tenantSlug?: string;
};

export interface TenantContextProvider {
  getTenantOrThrow(): TenantScopeContext;
}

type IdentityClsStore = ClsStore & {
  tenant?: {
    id?: string;
    tenantId?: string;
    slug?: string;
    tenantSlug?: string;
  };
  tenantId?: string;
  tenantSlug?: string;
};

@Injectable()
export class ClsTenantContextProvider implements TenantContextProvider {
  public constructor(private readonly cls: ClsService<IdentityClsStore>) {}

  public getTenantOrThrow(): TenantScopeContext {
    const store = this.cls.get();
    const tenantId = store.tenantId ?? store.tenant?.tenantId ?? store.tenant?.id;

    if (!tenantId) {
      throw new ForbiddenException("Tenant context is required for tenant-scoped data access.");
    }

    return {
      tenantId,
      tenantSlug: store.tenantSlug ?? store.tenant?.tenantSlug ?? store.tenant?.slug,
    };
  }
}
