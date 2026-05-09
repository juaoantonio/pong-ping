export type ISODateString = string;

export interface ApiResponseMetaContract {
  requestId?: string;
  timestamp: ISODateString;
}

export interface ApiSuccessResponseContract<TData> {
  ok: true;
  data: TData;
  meta: ApiResponseMetaContract;
}

export interface ApiErrorContract {
  status: number;
  code: string;
  message: string;
  details: unknown[];
  path: string;
  method: string;
  requestId?: string;
  timestamp: ISODateString;
}

export interface ApiErrorResponseContract {
  ok: false;
  error: ApiErrorContract;
}

export type ApiResponseContract<TData> =
  | ApiSuccessResponseContract<TData>
  | ApiErrorResponseContract;

export const IDENTITY_SYSTEM_ROLE_CONTRACT = {
  SYSTEM_ADMIN: "system_admin",
} as const;

export type IdentitySystemRoleContract =
  (typeof IDENTITY_SYSTEM_ROLE_CONTRACT)[keyof typeof IDENTITY_SYSTEM_ROLE_CONTRACT];

export const IDENTITY_TENANT_ROLE_CONTRACT = {
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type IdentityTenantRoleContract =
  (typeof IDENTITY_TENANT_ROLE_CONTRACT)[keyof typeof IDENTITY_TENANT_ROLE_CONTRACT];

export interface AuthSessionResponseContract {
  sessionId: string;
}

export interface AuthLogoutResponseContract {
  revoked: true;
}

export interface IdentityPrincipalResponseContract {
  userId: string;
  tenantId: string | null;
  sessionId: string;
  systemRoles: IdentitySystemRoleContract[];
  tenantRoles: IdentityTenantRoleContract[];
}

export interface CreateSystemTenantRequestContract {
  name: string;
  slug: string;
  adminEmail: string;
}

export interface UpdateSystemTenantRequestContract {
  name?: string;
  slug?: string;
  active?: boolean;
}

export interface SystemTenantResponseContract {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  activeMembershipCount: number;
  adminEmails: string[];
}

export interface CreateSystemMembershipRequestContract {
  email: string;
  roles: IdentityTenantRoleContract[];
}

export interface UpdateSystemMembershipRequestContract {
  roles?: IdentityTenantRoleContract[];
  active?: boolean;
}

export interface SystemMembershipResponseContract {
  id: string;
  tenantId: string;
  userId: string;
  email: string;
  roles: IdentityTenantRoleContract[];
  active: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface SystemMembershipDeactivationResponseContract {
  deactivated: true;
}
