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

import { signInWithGoogle } from "@/app/actions/auth";

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

describe("signInWithGoogle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the bound tenant slug and ignores editable FormData tenantSlug fields", async () => {
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

  it("redirects to tenant_not_found without setting the pending cookie or calling signIn", async () => {
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
