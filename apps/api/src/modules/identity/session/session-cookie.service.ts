import {Injectable} from "@nestjs/common";
import {ConfigService} from "@nestjs/config";
import type {Request, Response} from "express";
import type {ConfigSchema} from "../../../common/config/config.module";

@Injectable()
export class SessionCookieService {
  public constructor(private readonly config: ConfigService<ConfigSchema>) {}

  private get baseName(): string {
    return this.config.getOrThrow<string>("SESSION_COOKIE_NAME");
  }

  private get isProduction(): boolean {
    return this.config.getOrThrow<string>("NODE_ENV") === "production";
  }

  private get rootDomain(): string {
    return this.config.getOrThrow<string>("ROOT_DOMAIN");
  }

  private get ttlSeconds(): number {
    return this.config.getOrThrow<number>("SESSION_TTL_SECONDS");
  }

  public getSystemSessionCookieName(): string {
    return `${this.baseName}_system`;
  }

  public getTenantSessionCookieName(tenantSlug: string): string {
    return `${this.baseName}_${tenantSlug.toLowerCase()}`;
  }

  public setSessionCookie(
    res: Response,
    name: string,
    token: string,
    options?: { maxAgeSeconds?: number },
  ): void {
    const maxAgeSeconds = options?.maxAgeSeconds ?? this.ttlSeconds;

    res.cookie(name, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.isProduction,
      maxAge: maxAgeSeconds * 1000,
      path: "/",
      domain: this.getCookieDomain(),
    });
  }

  public clearSessionCookie(res: Response, name: string): void {
    res.clearCookie(name, {
      httpOnly: true,
      sameSite: "lax",
      secure: this.isProduction,
      maxAge: 0,
      expires: new Date(0),
      path: "/",
      domain: this.getCookieDomain(),
    });
  }

  public getCookieDomain(): string | undefined {
    const domain = this.rootDomain.trim().toLowerCase();

    if (domain === "localhost" || domain.endsWith(".localhost")) {
      return undefined;
    }

    return `.${domain}`;
  }

  public parseCookie(req: Request, name: string): string | undefined {
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

  // --- Encapsulated logic from @apps/web/src/lib/auth/cookies.ts ---

  public canShareAuthCookiesAcrossSubdomains(): boolean {
    return Boolean(this.getCookieDomain());
  }

  public getSharedAuthCookies() {
    if (!this.getCookieDomain()) {
      return undefined;
    }

    const prefix = this.isProduction ? "__Secure-" : "";

    const sharedOptions = (maxAge?: number) => ({
      domain: this.getCookieDomain(),
      httpOnly: true,
      maxAge,
      path: "/",
      sameSite: "lax" as const,
      secure: this.isProduction,
    });

    return {
      sessionToken: {
        name: `${prefix}authjs.session-token`,
        options: sharedOptions(),
      },
      callbackUrl: {
        name: `${prefix}authjs.callback-url`,
        options: sharedOptions(),
      },
      pkceCodeVerifier: {
        name: `${prefix}authjs.pkce.code_verifier`,
        options: sharedOptions(60 * 15),
      },
      state: {
        name: `${prefix}authjs.state`,
        options: sharedOptions(60 * 15),
      },
      nonce: {
        name: `${prefix}authjs.nonce`,
        options: sharedOptions(),
      },
      webauthnChallenge: {
        name: `${prefix}authjs.challenge`,
        options: sharedOptions(60 * 15),
      },
    };
  }
}
