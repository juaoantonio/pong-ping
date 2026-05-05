import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getAuthCookieDomain } from "@/lib/auth/cookies";

const PENDING_TENANT_COOKIE = "pong_ping_pending_tenant";
const PENDING_TENANT_MAX_AGE_SECONDS = 10 * 60;

export type PendingTenant = {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  expiresAt: number;
};

type PendingTenantInput = Omit<PendingTenant, "expiresAt">;

function getSigningSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required to sign pending tenant cookies.");
  }

  return "pong-ping-local-pending-tenant-secret";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSigningSecret()).update(value).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function serializePendingTenant(input: PendingTenantInput) {
  const payload: PendingTenant = {
    ...input,
    expiresAt: Date.now() + PENDING_TENANT_MAX_AGE_SECONDS * 1000,
  };
  const body = encodeBase64Url(JSON.stringify(payload));

  return `${body}.${sign(body)}`;
}

function parsePendingTenant(value: string): PendingTenant | null {
  const [body, signature] = value.split(".");

  if (!body || !signature || !signaturesMatch(signature, sign(body))) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(body)) as Partial<PendingTenant>;

    if (
      typeof parsed.tenantId !== "string" ||
      typeof parsed.tenantSlug !== "string" ||
      typeof parsed.tenantName !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      tenantId: parsed.tenantId,
      tenantSlug: parsed.tenantSlug,
      tenantName: parsed.tenantName,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function setPendingTenantCookie(input: PendingTenantInput) {
  const cookieStore = await cookies();

  cookieStore.set(PENDING_TENANT_COOKIE, serializePendingTenant(input), {
    domain: getAuthCookieDomain(),
    httpOnly: true,
    maxAge: PENDING_TENANT_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getPendingTenantCookie() {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_TENANT_COOKIE)?.value;

  return value ? parsePendingTenant(value) : null;
}

export async function clearPendingTenantCookie() {
  const cookieStore = await cookies();

  cookieStore.set(PENDING_TENANT_COOKIE, "", {
    domain: getAuthCookieDomain(),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
