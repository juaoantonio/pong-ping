import { type NextRequest, NextResponse } from "next/server";
import { internalApiUrl } from "@/lib/api/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const rewrites: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
  [/^invitations\/([^/]+)$/, (match) => `invitations/${match[1]}/claim`],
];

function mapPath(path: string) {
  for (const [pattern, replacement] of rewrites) {
    const match = path.match(pattern);
    if (match) {
      return replacement(match);
    }
  }

  return path;
}

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = mapPath(path.join("/"));
  const url = new URL(`${internalApiUrl()}/${targetPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.text(),
    cache: "no-store",
  });

  const responseText = await response.text();
  let body = responseText;
  const contentType =
    response.headers.get("content-type") ?? "application/json";

  if (contentType.includes("application/json")) {
    const parsed = JSON.parse(responseText || "null") as
      | { ok: true; data: unknown }
      | { ok: false; error: { message?: string } }
      | null;
    if (parsed?.ok === true) {
      body = JSON.stringify(parsed.data);
    } else if (parsed?.ok === false) {
      body = JSON.stringify({
        error: parsed.error.message ?? "Nao foi possivel concluir a acao.",
      });
    }
  }

  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });

  const headersWithCookies = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof headersWithCookies.getSetCookie === "function"
      ? headersWithCookies.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

  setCookies.forEach((cookie) => {
    nextResponse.headers.append("Set-Cookie", cookie);
  });

  return nextResponse;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
