import type { ClsStore } from "nestjs-cls";

export type TenantContext = {
  id: string;
  slug: string;
};

export type IdentityPrincipal = {
  userId: string;
  tenantId: string;
  sessionId: string;
  systemRoles: readonly string[];
  tenantRoles: readonly string[];
};

declare module "nestjs-cls" {
  interface ClsStore {
    requestId?: string;
    tenant?: TenantContext;
    principal?: IdentityPrincipal;
  }
}

export interface IdentityRequestContext extends ClsStore {}
