import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TenantsAdmin } from "@/app/admin/tenants/tenants-admin";

const refresh = jest.fn();
const logout = jest.fn();
const toastSuccess = jest.fn();
const toastError = jest.fn();
const writeText = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

jest.mock("@/app/actions/auth", () => ({
  logout: (...args: unknown[]) => logout(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: (...args: unknown[]) => toastSuccess(...args),
  },
}));

const tenants = [
  {
    id: "tenant-1",
    name: "Alpha Club",
    slug: "alpha-club",
    createdAt: "2026-05-05T12:00:00.000Z",
    userCount: 3,
  },
];

describe("admin de tenants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText,
      },
    });
  });

  it("renderiza links de login do tenant usando o slug do tenant", () => {
    render(<TenantsAdmin tenants={tenants} />);

    expect(screen.getByRole("link", { name: /abrir login de alpha club/i })).toHaveAttribute(
      "href",
      "/login?tenant=alpha-club",
    );
  });

  it("copia link absoluto de login do tenant a partir do host atual", async () => {
    writeText.mockResolvedValue(undefined);

    render(<TenantsAdmin tenants={tenants} />);

    await userEvent.click(
      screen.getByRole("button", { name: /copiar link de alpha club/i }),
    );

    expect(writeText).toHaveBeenCalledWith(
      "http://localhost/login?tenant=alpha-club",
    );
    expect(toastSuccess).toHaveBeenCalledWith("Link de login do tenant copiado.");
  });

  it("faz logout e redireciona para caminho de login do tenant", async () => {
    logout.mockResolvedValue(undefined);

    render(<TenantsAdmin tenants={tenants} />);

    await userEvent.click(
      screen.getByRole("button", {
        name: /sair e abrir login de alpha club/i,
      }),
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalledWith("/login?tenant=alpha-club");
    });
  });
});
