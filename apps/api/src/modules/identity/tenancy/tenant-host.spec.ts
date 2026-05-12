import { describe, expect, it } from "vitest";
import { parseTenantSlugFromHost } from "./tenant-host";

describe("parseTenantSlugFromHost", () => {
  it("resolve primeiro subdominio como slug", () => {
    expect(parseTenantSlugFromHost("acme.example.test", "example.test", ["api", "www"])).toEqual({
      status: "resolved",
      slug: "acme",
    });
  });

  it("ignora porta e casing", () => {
    expect(parseTenantSlugFromHost("Acme.Example.Test:3001", "example.test", [])).toEqual({
      status: "resolved",
      slug: "acme",
    });
  });

  it("rejeita host sem subdominio", () => {
    expect(parseTenantSlugFromHost("example.test", "example.test", [])).toEqual({
      status: "missing",
    });
  });

  it("rejeita subdominio reservado", () => {
    expect(parseTenantSlugFromHost("api.example.test", "example.test", ["api"])).toEqual({
      status: "reserved",
    });
    expect(
      parseTenantSlugFromHost("api.localhost.me", "localhost.me", ["auth", "api", "www"]),
    ).toEqual({
      status: "reserved",
    });
  });

  it("rejeita dominio raiz diferente", () => {
    expect(parseTenantSlugFromHost("acme.other.test", "example.test", [])).toEqual({
      status: "invalid_root",
    });
  });
});
