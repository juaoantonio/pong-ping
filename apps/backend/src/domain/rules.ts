import { createHash, randomBytes } from "node:crypto";
import type { InvitationExpiryPreset, Role } from "@pong-ping/shared";
import { INVITATION_EXPIRY_PRESETS, roles, roleHierarchy } from "@pong-ping/shared";

export const MATCH_ELO_K = 64;
export const DEFAULT_PLAYER_ELO = 1000;

export function createId() {
  return `c${randomBytes(12).toString("base64url").replace(/[-_]/g, "").slice(0, 24)}`;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function createRoomInvitationToken() {
  return randomBytes(24).toString("hex");
}

export function isInvitationExpiryPreset(value: unknown): value is InvitationExpiryPreset {
  return typeof value === "string" && INVITATION_EXPIRY_PRESETS.some((preset) => preset.value === value);
}

export function getInvitationExpiry(preset: InvitationExpiryPreset = "15m", now = Date.now()) {
  const duration = INVITATION_EXPIRY_PRESETS.find((option) => option.value === preset)?.milliseconds;

  if (!duration) {
    throw new Error("invalid_invitation_expiry_preset");
  }

  return new Date(now + duration);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

export function hasRole(userRole: Role, requiredRole: Role) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessAdmin(userRole: Role) {
  return hasRole(userRole, "admin");
}

export function canManageUser(actorRole: Role, targetRole: Role) {
  if (actorRole === "superadmin") {
    return targetRole === "admin" || targetRole === "user";
  }

  if (actorRole === "admin") {
    return targetRole === "user";
  }

  return false;
}

export function canDeleteUser(actorRole: Role, targetRole: Role) {
  return canManageUser(actorRole, targetRole);
}

export function canChangeRole(actorRole: Role) {
  return actorRole === "superadmin";
}

export function isInitialSuperAdminEmail(email: string | null | undefined, superadminEmail: string | null | undefined) {
  return Boolean(email && superadminEmail && normalizeEmail(email) === normalizeEmail(superadminEmail));
}

export function calculateElo(winnerElo: number, loserElo: number, k: number) {
  const expectedWinnerScore = 1 / (1 + 10 ** ((loserElo - winnerElo) / 400));
  const expectedLoserScore = 1 / (1 + 10 ** ((winnerElo - loserElo) / 400));

  return {
    winnerElo: Math.round(winnerElo + k * (1 - expectedWinnerScore)),
    loserElo: Math.round(loserElo + k * (0 - expectedLoserScore)),
  };
}

export function calculateWinRate(wins: number, totalMatches: number) {
  if (totalMatches <= 0) {
    return 0;
  }

  return Number(((wins / totalMatches) * 100).toFixed(2));
}

export function rotateQueueAfterMatch(queueParticipantIds: string[], winnerParticipantId: string) {
  if (queueParticipantIds.length < 2) {
    throw new Error("not_enough_players");
  }

  const currentPlayers = queueParticipantIds.slice(0, 2);

  if (!currentPlayers.includes(winnerParticipantId)) {
    throw new Error("winner_not_in_current_match");
  }

  const loserParticipantId = currentPlayers.find((participantId) => participantId !== winnerParticipantId);

  if (!loserParticipantId) {
    throw new Error("loser_not_found");
  }

  return [winnerParticipantId, ...queueParticipantIds.slice(2), loserParticipantId];
}
