import { render, waitFor } from "@testing-library/react";
import { CurrentTenantMemory } from "@/components/auth/current-tenant-memory";
import { LOGIN_TENANT_STORAGE_KEY } from "@/lib/auth/login-tenant";

describe("memoria do tenant atual", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("armazena slug do tenant autenticado para futuras visitas ao login", async () => {
    render(<CurrentTenantMemory tenantSlug="alpha" />);

    await waitFor(() => {
      expect(
        window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY),
      ).toBe("alpha");
    });
  });

  it("nao sobrescreve tenant armazenado quando nenhum tenant esta disponivel", async () => {
    window.localStorage.setItem(LOGIN_TENANT_STORAGE_KEY, "alpha");

    render(<CurrentTenantMemory tenantSlug={null} />);

    await waitFor(() => {
      expect(
        window.localStorage.getItem(LOGIN_TENANT_STORAGE_KEY),
      ).toBe("alpha");
    });
  });

  it("nao falha quando storage do navegador esta indisponivel", async () => {
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
