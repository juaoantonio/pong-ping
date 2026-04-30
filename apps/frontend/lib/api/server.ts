import { cookies } from "next/headers";
import type { ApiResponse, AuthUser, Role } from "@pong-ping/shared";
import { redirect } from "next/navigation";

export function internalApiUrl() {
  return (
    process.env.BACKEND_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000/api/v1"
  );
}

export async function apiGet<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${internalApiUrl()}${path}`, {
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    cache: "no-store",
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.ok) {
    throw new Error(
      body && "error" in body ? body.error.message : "api_request_failed",
    );
  }

  return body.data;
}

export async function apiMutate<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${internalApiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  const body = (await response
    .json()
    .catch(() => null)) as ApiResponse<T> | null;
  if (!response.ok || !body?.ok) {
    throw new Error(
      body && "error" in body ? body.error.message : "api_request_failed",
    );
  }

  return body.data;
}

export async function getCurrentUser() {
  try {
    const data = await apiGet<{ user: AuthUser }>("/auth/me");
    return data.user;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(requiredRole: Role) {
  const user = await requireAuth();
  const hierarchy: Record<Role, number> = { user: 1, admin: 2, superadmin: 3 };

  if (hierarchy[user.role] < hierarchy[requiredRole]) {
    redirect("/unauthorized");
  }

  return user;
}
