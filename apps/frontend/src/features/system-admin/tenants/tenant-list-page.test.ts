import { describe, expect, it } from "vitest";
import { getTenantBaseUrl } from "@/features/system-admin/tenants/tenant-list-page";

describe("getTenantBaseUrl", () => {
  it("builds a tenant club URL from localhost admin origin", () => {
    expect(getTenantBaseUrl("downtown", "http://localhost:5173/club")).toBe(
      "http://downtown.localhost:5173/club",
    );
  });

  it("replaces an existing subdomain on deployed admin origins", () => {
    expect(getTenantBaseUrl("downtown", "https://admin.pongping.example/admin/tenants")).toBe(
      "https://downtown.pongping.example/club",
    );
  });

  it("uses the current root host when no admin subdomain is present", () => {
    expect(getTenantBaseUrl("downtown", "https://pongping.example/admin/tenants")).toBe(
      "https://downtown.pongping.example/club",
    );
  });

  it("uses the frontend path even when the provided URL is the tenant callback target", () => {
    expect(getTenantBaseUrl("downtown", "https://app.pongping.example/club/login")).toBe(
      "https://downtown.pongping.example/club",
    );
  });
});
