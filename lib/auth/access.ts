import "server-only";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const INVITE_TTL_MINUTES = 15;

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

export function getInvitationExpiry() {
  return new Date(Date.now() + INVITE_TTL_MINUTES * 60 * 1000);
}

export async function isEmailAllowed(email?: string | null) {
  if (!email) {
    return false;
  }

  const allowedEmail = await prisma.allowedEmail.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true },
  });

  return Boolean(allowedEmail);
}

export async function allowEmail(email: string, createdByUserId?: string | null) {
  const normalizedEmail = normalizeEmail(email);

  return prisma.allowedEmail.upsert({
    where: { email: normalizedEmail },
    create: {
      email: normalizedEmail,
      createdByUserId,
    },
    update: {},
  });
}
