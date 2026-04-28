import "server-only";

import { allowEmail, isEmailAllowed, normalizeEmail } from "@/lib/auth/access";

export function isInitialSuperAdminEmail(email?: string | null) {
  return Boolean(
    email &&
      process.env.SUPERADMIN_EMAIL &&
      normalizeEmail(email) === normalizeEmail(process.env.SUPERADMIN_EMAIL),
  );
}

export async function canSignInWithEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const normalizedEmail = normalizeEmail(email);

  return isInitialSuperAdminEmail(normalizedEmail) || isEmailAllowed(normalizedEmail);
}

export async function ensureInitialSuperAdminAllowed(email: string, userId: string) {
  if (!isInitialSuperAdminEmail(email)) {
    return false;
  }

  await allowEmail(email, userId);
  return true;
}
