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

describe("memoria do tenant no login", () => {
  beforeEach(() => {
    replace.mockClear();
    pathname = "/login";
    searchParams = new URLSearchParams();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("armazena tenant normalizado a partir de exatamente uma query tenant nao vazia", async () => {
    const { container } = renderWithSearch("tenant=%20AcMe%20");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("acme");
    });
    expect(replace).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });

  it("redireciona para o tenant armazenado nao padrao quando a query esta ausente", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch();

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?tenant=alpha");
    });
  });

  it("preserva parametros de query existentes ao redirecionar com o tenant armazenado", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("error=tenant_context_required");

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        "/login?error=tenant_context_required&tenant=alpha",
      );
    });
  });

  it("nao faz nada quando storage esta vazio ou contem o tenant padrao", async () => {
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

  it("nao sobrescreve storage para queries tenant repetidas", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=beta&tenant=gamma");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("nao sobrescreve storage para queries tenant em branco", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=%20%20");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("nao sobrescreve storage para queries tenant malformadas", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    renderWithSearch("tenant=bad%2Fslug");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBe("alpha");
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("limpa storage obsoleto em vez de restaura-lo apos tenant_not_found", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "missing-tenant");

    renderWithSearch("error=tenant_not_found");

    await waitFor(() => {
      expect(window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY)).toBeNull();
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it("nao falha quando storage do navegador esta indisponivel", async () => {
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
