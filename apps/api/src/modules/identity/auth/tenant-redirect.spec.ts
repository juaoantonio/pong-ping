import { describe, expect, it } from "vitest";
import { buildTenantFrontendRedirectUrl } from "./tenant-redirect";

describe("buildTenantFrontendRedirectUrl", () => {
  it("monta redirect de localhost com slug do tenant e returnTo interno", () => {
    expect(
      buildTenantFrontendRedirectUrl({
        tenantFrontendUrl: "http://localhost:5173/club",
        rootDomain: "localhost",
        tenantSlug: "acme",
        returnTo: "/club/settings",
      }),
    ).toBe("http://acme.localhost:5173/club/settings");
  });

  it("monta redirect de dominio de producao e usa /club por padrao", () => {
    expect(
      buildTenantFrontendRedirectUrl({
        tenantFrontendUrl: "https://app.pongping.example/club",
        rootDomain: "pongping.example",
        tenantSlug: "acme",
      }),
    ).toBe("https://acme.pongping.example/club");
  });
});
