import type { Role } from "@/lib/auth/roles";

export const AUTHENTICATED_USER_KEY = "/api/auth/me";

export type ClientAuthenticatedUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
};

export type AuthenticatedUserResponse = {
  user: ClientAuthenticatedUser | null;
};
