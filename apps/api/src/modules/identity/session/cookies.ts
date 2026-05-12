import type { Request, Response } from "express";

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  const rawValue = header
    .split(";")
    .map((part) => part.trim())
    .map((part) => part.split("="))
    .find(([cookieName]) => cookieName === name)?.[1];

  if (!rawValue) return rawValue;

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

export function setSessionCookie(
  res: Response,
  name: string,
  token: string,
  maxAgeSeconds: number,
  options: SessionCookieOptions,
): void {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: options.secure,
    maxAge: maxAgeSeconds * 1000,
    path: "/",
    ...domainOption(options),
  });
}

export function clearSessionCookie(
  res: Response,
  name: string,
  options: SessionCookieOptions,
): void {
  res.clearCookie(name, {
    httpOnly: true,
    sameSite: "lax",
    secure: options.secure,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
    ...domainOption(options),
  });
}

export type SessionCookieOptions = {
  secure: boolean;
  rootDomain: string;
};

export function getSessionCookieDomain(rootDomain: string, _secure: boolean): string | undefined {
  const normalizedRoot = rootDomain.trim().toLowerCase();
  if (normalizedRoot === "localhost") {
    return undefined;
  }

  if (normalizedRoot.endsWith(".localhost")) {
    return undefined;
  }

  return `.${normalizedRoot}`;
}

function domainOption(options: SessionCookieOptions): { domain?: string } {
  const domain = getSessionCookieDomain(options.rootDomain, options.secure);
  return domain ? { domain } : {};
}
