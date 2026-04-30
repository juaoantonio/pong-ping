import type { AuthUser } from "@pong-ping/shared";

export type AuthenticatedUser = AuthUser;

export { getCurrentUser, requireAuth, requireRole } from "@/lib/api/server";
