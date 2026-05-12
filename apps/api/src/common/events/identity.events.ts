export const IDENTITY_EVENT = {
  TENANT_CREATED: "identity.tenant.created",
  TENANT_UPDATED: "identity.tenant.updated",
  TENANT_USER_AUTHENTICATED: "identity.tenant.user_authenticated",
} as const;

export type IdentityTenantCreatedEvent = {
  tenantId: string;
  name: string;
  slug: string;
  active: boolean;
  occurredAt: Date;
};

export type IdentityTenantUpdatedEvent = IdentityTenantCreatedEvent;

export type IdentityTenantUserAuthenticatedEvent = {
  tenantId: string;
  userId: string;
  displayName: string | null;
  email: string;
  occurredAt: Date;
};
