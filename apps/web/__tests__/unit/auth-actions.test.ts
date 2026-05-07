class RedirectError extends Error {
  constructor(readonly location: string) {
    super(`Redirected to ${location}`);
  }
}

jest.mock("@/auth", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("@/lib/auth/pending-tenant", () => ({
  setPendingTenantCookie: jest.fn(),
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
  redirect: jest.fn((location: string) => {
    throw new RedirectError(location);
  }),
}));

import { logout, signInWithGoogle } from "@/app/actions/auth";

const { signIn: mockedSignIn } = jest.requireMock("@/auth") as {
  signIn: jest.Mock;
};
const { setPendingTenantCookie: mockedSetPendingTenantCookie } = jest.requireMock(
  "@/lib/auth/pending-tenant",
) as {
  setPendingTenantCookie: jest.Mock;
};
const { buildTenantUrlFromRequest: mockedBuildTenantUrlFromRequest } = jest.requireMock(
  "@/lib/tenants/request",
) as {
  buildTenantUrlFromRequest: jest.Mock;
};
const mockedFindUnique = (jest.requireMock("@/lib/prisma") as {
  prisma: {
    tenant: {
      findUnique: jest.Mock;
    };
  };
}).prisma.tenant.findUnique;
const { redirect: mockedRedirect } = jest.requireMock("next/navigation") as {
  redirect: jest.Mock;
};

describe("login com Google", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("usa slug de tenant vinculado e ignora campos tenantSlug editaveis do FormData", async () => {
    mockedFindUnique.mockResolvedValue({
      id: "tenant-1",
      slug: "acme",
      name: "Acme",
    });
    mockedBuildTenantUrlFromRequest.mockResolvedValue("/tenants/acme/tables");

    const formData = new FormData();
    formData.set("tenantSlug", "evil");

    await signInWithGoogle("  ACME  ", formData);

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: {
        slug: "acme",
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });
    expect(mockedSetPendingTenantCookie).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      tenantSlug: "acme",
      tenantName: "Acme",
    });
    expect(mockedBuildTenantUrlFromRequest).toHaveBeenCalledWith("/tables", "acme");
    expect(mockedSignIn).toHaveBeenCalledWith("google", {
      redirectTo: "/tenants/acme/tables",
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
  });

  it("redireciona para tenant_not_found sem definir cookie pendente nem chamar signIn", async () => {
    mockedFindUnique.mockResolvedValue(null);

    await expect(signInWithGoogle(undefined, new FormData())).rejects.toMatchObject({
      location: "/login?error=tenant_not_found",
    });

    expect(mockedFindUnique).toHaveBeenCalledWith({
      where: {
        slug: "default",
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });
    expect(mockedSetPendingTenantCookie).not.toHaveBeenCalled();
    expect(mockedBuildTenantUrlFromRequest).not.toHaveBeenCalled();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });
});

describe("saida da conta", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("permite redirecionar para caminho de login de tenant", async () => {
    await logout("/login?tenant=alpha");

    expect((jest.requireMock("@/auth") as { signOut: jest.Mock }).signOut).toHaveBeenCalledWith({
      redirectTo: "/login?tenant=alpha",
    });
  });

  it("usa login como fallback para redirecionamentos inseguros", async () => {
    await logout("https://evil.example/login?tenant=alpha");

    expect((jest.requireMock("@/auth") as { signOut: jest.Mock }).signOut).toHaveBeenCalledWith({
      redirectTo: "/login",
    });
  });

  it("nao permite caminhos de login parecidos", async () => {
    await logout("/login-redirect?tenant=alpha");

    expect((jest.requireMock("@/auth") as { signOut: jest.Mock }).signOut).toHaveBeenCalledWith({
      redirectTo: "/login",
    });
  });
});
