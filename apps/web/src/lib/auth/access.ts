import "server-only";

import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
export { getInvitationExpiry } from "@/lib/invitations";

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

export async function isEmailAllowed(
  email?: string | null,
  tenantId?: string | null,
) {
  if (!email || !tenantId) {
    return false;
  }

  const allowedEmail = await prisma.allowedEmail.findUnique({
    where: {
      tenantId_email: {
        tenantId,
        email: normalizeEmail(email),
      },
    },
    select: { id: true },
  } as never);

  return Boolean(allowedEmail);
}

export async function allowEmail(
  email: string,
  tenantId: string,
  createdByUserId?: string | null,
) {
  const normalizedEmail = normalizeEmail(email);

  return prisma.allowedEmail.upsert({
    where: {
      tenantId_email: {
        tenantId,
        email: normalizedEmail,
      },
    },
    create: {
      tenantId,
      email: normalizedEmail,
      createdByUserId,
    },
    update: {},
  } as never);
}
