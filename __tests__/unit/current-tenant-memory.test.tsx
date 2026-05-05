import { render, waitFor } from "@testing-library/react";
import { CurrentTenantMemory } from "@/components/auth/current-tenant-memory";
import { LOGIN_TENANT_STORAGE_KEY } from "@/lib/auth/login-tenant";

describe("CurrentTenantMemory", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores the authenticated tenant slug for future login visits", async () => {
    render(<CurrentTenantMemory tenantSlug="alpha" />);

    await waitFor(() => {
      expect(
        window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY),
      ).toBe("alpha");
    });
  });

  it("does not overwrite stored tenant when no tenant is available", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    render(<CurrentTenantMemory tenantSlug={null} />);

    await waitFor(() => {
      expect(
        window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY),
      ).toBe("alpha");
    });
  });

  it("does not fail when browser storage is unavailable", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    render(<CurrentTenantMemory tenantSlug="alpha" />);

    await waitFor(() => {
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        LOGIN_TENANT_STORAGE_KEY,
        "alpha",
      );
    });
  });
});
