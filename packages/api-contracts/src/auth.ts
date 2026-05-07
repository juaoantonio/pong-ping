import type { OkResponseDataDto, RoleDto } from "./shared.js";

export interface ClientAuthenticatedUserDto {
  id: string;
  tenantName: string | null;
  tenantSlug: string | null;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: RoleDto;
}

export interface AuthMeResponseDataDto {
  user: ClientAuthenticatedUserDto | null;
}

export type LogoutResponseDataDto = OkResponseDataDto;
