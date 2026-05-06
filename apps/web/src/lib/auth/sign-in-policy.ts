import "server-only";

import { allowEmail, isEmailAllowed, normalizeEmail } from "@/lib/auth/access";

export function isInitialSuperAdminEmail(email?: string | null) {
  return Boolean(
    email &&
      process.env.SUPERADMIN_EMAIL &&
      normalizeEmail(email) === normalizeEmail(process.env.SUPERADMIN_EMAIL),
  );
}

export async function canSignInWithEmail(
  email?: string | null,
  tenantId?: string | null,
) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);

  if (isInitialSuperAdminEmail(normalizedEmail)) {
    return true;
  }

  if (!tenantId) {
    return false;
  }

  return isEmailAllowed(normalizedEmail, tenantId);
}

export async function ensureInitialSuperAdminAllowed(
  email: string,
  userId: string,
  tenantId?: string | null,
) {
  if (!isInitialSuperAdminEmail(email)) {
    return false;
  }

  if (!tenantId) {
    return false;
  }

  await allowEmail(email, tenantId, userId);
  return true;
}
