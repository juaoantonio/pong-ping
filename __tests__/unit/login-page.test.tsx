import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";

jest.mock("@/auth", () => ({
  auth: jest.fn(async () => null),
}));

jest.mock("@/app/actions/auth", () => ({
  signInWithGoogle: jest.fn(),
}));

jest.mock("@/lib/tenants/request", () => ({
  buildTenantUrlFromRequest: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

const mockedFindUnique = (jest.requireMock("@/lib/prisma") as {
  prisma: {
    tenant: {
      findUnique: jest.Mock;
    };
  };
}).prisma.tenant.findUnique;

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFindUnique.mockResolvedValue({
      name: "Alpha Club",
      slug: "alpha",
    });
  });

  it("uses the tenant query param to show a welcome message without rendering a tenant input", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ tenant: "alpha" }),
    });

    render(page);

    expect(screen.getByText("Bem-vindo ao Alpha Club.")).toBeInTheDocument();
    expect(screen.getByText("Organização")).toBeInTheDocument();
    expect(screen.getByText("Alpha Club")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /entrar com google/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^tenant$/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[name="tenantSlug"]')).toBeNull();
  });

  it("falls back to the default tenant when the query param is absent", async () => {
    mockedFindUnique.mockResolvedValue({
      name: "Default Club",
      slug: "default",
    });

    const page = await LoginPage({
      searchParams: Promise.resolve({}),
    });

    render(page);

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: { slug: "default" },
      select: { name: true, slug: true },
    });
    expect(screen.getByText("Bem-vindo ao Default Club.")).toBeInTheDocument();
  });

  it("renders actionable mapped errors near the login action", async () => {
    const page = await LoginPage({
      searchParams: Promise.resolve({ error: "tenant_not_found" }),
    });

    render(page);

    expect(
      screen.getByText(/confira o link ou peça um novo convite/i),
    ).toBeInTheDocument();
  });
});
