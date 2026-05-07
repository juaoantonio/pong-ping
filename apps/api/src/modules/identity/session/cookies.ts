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
  secure: boolean,
): void {
  res.cookie(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: maxAgeSeconds * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response, name: string, secure: boolean): void {
  res.clearCookie(name, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });
}
