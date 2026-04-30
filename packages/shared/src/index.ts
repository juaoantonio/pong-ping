export type Role = "superadmin" | "admin" | "user";

export const roles = ["superadmin", "admin", "user"] as const;

export const roleHierarchy: Record<Role, number> = {
  user: 1,
  admin: 2,
  superadmin: 3,
};

export const INVITATION_EXPIRY_PRESETS = [
  { value: "15m", label: "15 minutos", milliseconds: 15 * 60 * 1000 },
  { value: "1h", label: "1 hora", milliseconds: 60 * 60 * 1000 },
  { value: "1d", label: "1 dia", milliseconds: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7 dias", milliseconds: 7 * 24 * 60 * 60 * 1000 },
] as const;

export type InvitationExpiryPreset =
  (typeof INVITATION_EXPIRY_PRESETS)[number]["value"];

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
};
