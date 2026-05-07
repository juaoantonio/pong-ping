import type {
  ISODateString,
  InvitationExpiryPresetDto,
  PaginationDataDto,
  RoleDto,
} from "./shared.js";

export interface AdminAllowedEmailDto {
  id: string;
  email: string;
  createdAt: ISODateString;
  createdBy: {
    email: string | null;
    name: string | null;
  } | null;
}

export interface AdminAuthInvitationDto {
  id: string;
  expiresAt: ISODateString;
  oneTimeUse: boolean;
  usedAt: ISODateString | null;
  usedByEmail: string | null;
  createdAt: ISODateString;
}

export interface ListAdminAccessResponseDataDto {
  allowedEmails: AdminAllowedEmailDto[];
  invitations: AdminAuthInvitationDto[];
  pageInfo: PaginationDataDto;
}

export interface CreateAdminAccessRequestDto {
  email?: string;
  expiresIn?: InvitationExpiryPresetDto;
  oneTimeUse?: boolean;
  type?: "invite";
}

export interface CreateAccessAllowedEmailResponseDataDto {
  allowedEmail: AdminAllowedEmailDto;
}

export interface CreateAccessInvitationResponseDataDto {
  invitation: AdminAuthInvitationDto;
  inviteUrl: string;
}

export type CreateAdminAccessResponseDataDto =
  | CreateAccessAllowedEmailResponseDataDto
  | CreateAccessInvitationResponseDataDto;

export interface AdminTenantDto {
  id: string;
  name: string;
  slug: string;
  createdAt: ISODateString;
  userCount: number;
}

export interface ListAdminTenantsResponseDataDto {
  tenants: AdminTenantDto[];
}

export interface CreateTenantRequestDto {
  name: string;
  slug?: string;
}

export interface CreateTenantResponseDataDto {
  tenant: AdminTenantDto;
}

export interface AdminUserDto {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: RoleDto;
  createdAt: ISODateString;
}

export interface ListAdminUsersResponseDataDto {
  pageInfo: PaginationDataDto;
  users: AdminUserDto[];
}

export interface UserIdParamsDto {
  id: string;
}

export interface ChangeUserRoleRequestDto {
  role: RoleDto;
}

export interface ChangeUserRoleResponseDataDto {
  user: AdminUserDto;
}
