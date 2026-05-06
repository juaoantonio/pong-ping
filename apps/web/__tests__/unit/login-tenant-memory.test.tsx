import { render, waitFor } from "@testing-library/react";
import { LoginTenantMemory } from "@/components/auth/login-tenant-memory";
import { LOGIN_TENANT_STORAGE_KEY } from "@/lib/auth/login-tenant";

const replace = jest.fn();
let pathname = "/login";
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({
    replace,
  }),
  useSearchParams: () => searchParams,
}));

function renderWithSearch(query = "") {
  searchParams = new URLSearchParams(query);

  return render(<LoginTenantMemory />);
}

describe("LoginTenantMemory", () => {
  beforeEach(() => {
    replace.mockClear();
    pathname = "/login";
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stores a normalized tenant from exactly one non-empty tenant query", async () => {
    const { container } = renderWithSearch("tenant=%20AcMe%20");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("acme");
    });
    expect(replace).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("redirects to the stored non-default tenant when the query is absent", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?tenant=alpha");
    });
  });

  it("preserves existing query params when redirecting with the stored tenant", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("error=tenant_context_required");

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/login?error=tenant_context_required&tenant=alpha",
      );
    });
  });

  it("does nothing when storage is empty or contains the default tenant", async () => {
    renderWithSearch("error=oauth_failed");

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });

    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "default");
    renderWithSearch("error=oauth_failed");

    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });

  it("does not overwrite storage for repeated tenant queries", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=beta&tenant=gamma");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not overwrite storage for blank tenant queries", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=%20%20");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not overwrite storage for malformed tenant queries", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=bad%2Fslug");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears stale storage instead of restoring it after tenant_not_found", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "missing-tenant");

    renderWithSearch("error=tenant_not_found");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBeNull();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("does not fail when browser storage is unavailable", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage blocked");
    });

    renderWithSearch();

    await waitFor(() => {
      expect(Storage.prototype.getItem).toHaveBeenCalledWith(
        LOGIN_TENANT_STORAGE_KEY,
      );
    });
    expect(replace).not.toHaveBeenCalled();
  });
});
