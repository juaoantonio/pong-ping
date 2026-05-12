import { validateInternalReturnTo } from "./oauth-state.service";

export function buildTenantFrontendRedirectUrl(input: {
  tenantFrontendUrl: string;
  rootDomain: string;
  tenantSlug: string;
  returnTo?: string;
}): string {
  const url = new URL(input.tenantFrontendUrl);
  url.hostname = `${input.tenantSlug}.${input.rootDomain}`;
  url.pathname = validateInternalReturnTo(input.returnTo);
  url.search = "";
  url.hash = "";

  return url.toString();
}
