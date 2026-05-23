import { z } from "zod";
import type { ApiSuccessResponseContract } from "@pong-ping/contracts";
import { ApiClientError, ApiParseError } from "@/lib/api/errors";

const DEFAULT_API_BASE_URL = "http://api.localhost.me:3001/v1";

const successEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.unknown(),
  meta: z.object({
    requestId: z.string().optional(),
    timestamp: z.string(),
  }),
});

const errorEnvelopeSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    status: z.number(),
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
    path: z.string().optional(),
    method: z.string().optional(),
    requestId: z.string().optional(),
    timestamp: z.string().optional(),
  }),
});

export type ApiRequestOptions<TBody> = Omit<
  RequestInit,
  "body" | "credentials"
> & {
  baseUrl?: string;
  body?: TBody;
};

export function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL
  ).replace(/\/+$/, "");
}

export function getSystemLoginUrl(
  options: { userAlias?: string; devBypassEnabled?: boolean } = {},
) {
  const path = isSocialAuthDevBypassEnabled(options.devBypassEnabled)
    ? "/system/auth/dev/google"
    : "/system/auth/google";
  const url = new URL(`${getApiBaseUrl()}${path}`);

  if (path.includes("/dev/") && options.userAlias) {
    url.searchParams.set("user", options.userAlias);
  }

  return url.toString();
}

export function isSocialAuthDevBypassEnabled(
  value: string | boolean | undefined = import.meta.env.VITE_SOCIAL_AUTH_DEV_BYPASS_ENABLED,
) {
  return value === true || value === "true";
}

export async function apiRequest<TData, TBody = never>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TData> {
  const { baseUrl = getApiBaseUrl(), body, ...requestOptions } = options;
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    ...requestOptions,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = errorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiClientError(parsed.data.error.message, {
        code: parsed.data.error.code,
        details: parsed.data.error.details,
        status: parsed.data.error.status,
      });
    }

    throw new ApiClientError("Nao foi possivel concluir a acao.", {
      code: "HTTP_ERROR",
      status: response.status,
    });
  }

  const parsed = successEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiParseError();
  }

  return (parsed.data as ApiSuccessResponseContract<TData>).data;
}
