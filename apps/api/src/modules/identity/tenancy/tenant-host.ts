export type TenantHostResolution =
  | { status: "resolved"; slug: string }
  | { status: "missing" | "reserved" | "invalid_root" };

export function parseTenantSlugFromHost(
  host: string | undefined,
  rootDomain: string,
  reservedSubdomains: readonly string[],
): TenantHostResolution {
  const hostname = normalizeHost(host);
  const normalizedRoot = rootDomain.toLowerCase();
  const reserved = reservedSubdomains.map((subdomain) => subdomain.toLowerCase());

  if (!hostname || hostname === normalizedRoot) {
    return { status: "missing" };
  }

  if (!hostname.endsWith(`.${normalizedRoot}`)) {
    return { status: "invalid_root" };
  }

  const suffixLength = normalizedRoot.length + 1;
  const subdomain = hostname.slice(0, -suffixLength);
  const slug = subdomain.split(".")[0];

  if (!slug) {
    return { status: "missing" };
  }

  if (reserved.includes(slug)) {
    return { status: "reserved" };
  }

  return { status: "resolved", slug };
}

function normalizeHost(host: string | undefined): string | undefined {
  return host
    ?.split(",")[0]
    ?.trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .split("/")[0]
    ?.toLowerCase()
    .replace(/:\d+$/, "");
}
