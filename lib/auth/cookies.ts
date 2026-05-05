const AUTH_COOKIE_DOMAIN_ENV = "AUTH_COOKIE_DOMAIN";

function cleanCookieDomain(value: string | undefined) {
  const domain = value?.trim();

  return domain && domain.length > 0 ? domain : undefined;
}

function stripLeadingDot(value: string) {
  return value.replace(/^\./, "").toLowerCase();
}

function isLocalhostCookieDomain(domain: string) {
  const normalized = stripLeadingDot(domain);

  return normalized === "localhost" || normalized.endsWith(".localhost");
}

export function getAuthCookieDomain() {
  const domain = cleanCookieDomain(process.env[AUTH_COOKIE_DOMAIN_ENV]);

  if (!domain || isLocalhostCookieDomain(domain)) {
    return undefined;
  }

  return domain;
}

export function canShareAuthCookiesAcrossSubdomains() {
  return Boolean(getAuthCookieDomain());
}

function shouldUseSecureAuthCookies() {
  return process.env.NODE_ENV === "production";
}

function authCookiePrefix() {
  return shouldUseSecureAuthCookies() ? "__Secure-" : "";
}

function sharedCookieOptions(maxAge?: number) {
  return {
    domain: getAuthCookieDomain(),
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: shouldUseSecureAuthCookies(),
  };
}

export function sharedAuthCookies() {
  if (!getAuthCookieDomain()) {
    return undefined;
  }

  const prefix = authCookiePrefix();

  return {
    sessionToken: {
      name: `${prefix}authjs.session-token`,
      options: sharedCookieOptions(),
    },
    callbackUrl: {
      name: `${prefix}authjs.callback-url`,
      options: sharedCookieOptions(),
    },
    pkceCodeVerifier: {
      name: `${prefix}authjs.pkce.code_verifier`,
      options: sharedCookieOptions(60 * 15),
    },
    state: {
      name: `${prefix}authjs.state`,
      options: sharedCookieOptions(60 * 15),
    },
    nonce: {
      name: `${prefix}authjs.nonce`,
      options: sharedCookieOptions(),
    },
    webauthnChallenge: {
      name: `${prefix}authjs.challenge`,
      options: sharedCookieOptions(60 * 15),
    },
  };
}
