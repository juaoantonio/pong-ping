const RESERVED_SUBDOMAINS = new Set(["api", "auth", "www"]);

type HostParts = {
  hostname: string;
  port: string | null;
};

function configuredRootDomain() {
  const domain =
    process.env.TENANT_ROOT_DOMAIN ??
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN ??
    process.env.AUTH_COOKIE_DOMAIN;

  return normalizeHostname(domain?.replace(/^\./, ""));
}

function normalizeHostname(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase().replace(/\.$/, "") || null;
}

function splitHost(value: string | null | undefined): HostParts | null {
  const normalized = normalizeHostname(value);

  if (!normalized) {
    return null;
  }

  const host = normalized.split(",")[0]?.trim();

  if (!host) {
    return null;
  }

  if (host.startsWith("[")) {
    const closingBracket = host.indexOf("]");
    const hostname = host.slice(1, closingBracket);
    const port = host.slice(closingBracket + 1).replace(/^:/, "") || null;

    return hostname ? { hostname, port } : null;
  }

  const [hostname, port] = host.split(":");

  return hostname ? { hostname, port: port || null } : null;
}

function isIpAddress(hostname: string) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function validTenantSlug(value: string | null | undefined) {
  if (!value || RESERVED_SUBDOMAINS.has(value)) {
    return null;
  }

  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value) ? value : null;
}

export function getTenantSlugFromHost(host: string | null | undefined) {
  const parts = splitHost(host);

  if (!parts || isIpAddress(parts.hostname)) {
    return null;
  }

  const rootDomain = configuredRootDomain();

  if (rootDomain) {
    if (
      parts.hostname === rootDomain ||
      !parts.hostname.endsWith(`.${rootDomain}`)
    ) {
      return null;
    }

    return validTenantSlug(parts.hostname.slice(0, -rootDomain.length - 1));
  }

  if (parts.hostname.endsWith(".localhost")) {
    return validTenantSlug(parts.hostname.slice(0, -".localhost".length));
  }

  const labels = parts.hostname.split(".");

  if (labels.length < 3) {
    return null;
  }

  return validTenantSlug(labels[0]);
}

export function buildTenantUrl(
  path: string,
  tenantSlug: string,
  requestHost: string | null | undefined,
  requestProtocol = "https",
) {
  const slug = validTenantSlug(tenantSlug);
  const parts = splitHost(requestHost);

  if (!slug || !parts) {
    return path;
  }

  const rootDomain = configuredRootDomain();
  const port = parts.port ? `:${parts.port}` : "";
  const pathname = path.startsWith("/") ? path : `/${path}`;

  if (rootDomain) {
    return `${requestProtocol}://${slug}.${rootDomain}${port}${pathname}`;
  }

  if (parts.hostname === "localhost" || parts.hostname.endsWith(".localhost")) {
    return `${requestProtocol}://${slug}.localhost${port}${pathname}`;
  }

  const labels = parts.hostname.split(".");
  const baseLabels = labels.length >= 3 ? labels.slice(1) : labels;

  return `${requestProtocol}://${slug}.${baseLabels.join(".")}${port}${pathname}`;
}

export function isAllowedTenantRedirectUrl(url: string, baseUrl: string) {
  const target = new URL(url, baseUrl);
  const base = new URL(baseUrl);

  if (target.origin === base.origin) {
    return true;
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return false;
  }

  const targetTenant = getTenantSlugFromHost(target.host);

  if (!targetTenant) {
    return false;
  }

  const rootDomain = configuredRootDomain();

  if (rootDomain) {
    return (
      target.hostname === `${targetTenant}.${rootDomain}` &&
      (target.protocol === base.protocol || rootDomain === "localhost")
    );
  }

  return (
    target.hostname.endsWith(".localhost") &&
    (base.hostname === "localhost" || base.hostname.endsWith(".localhost"))
  );
}
