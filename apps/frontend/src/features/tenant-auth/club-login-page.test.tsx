import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as TanStackRouter from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClubLoginPage } from "@/features/tenant-auth/club-login-page";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanStackRouter>();

  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      navigateMock(to);
      return <div data-testid="tenant-redirect" data-to={to} />;
    },
  };
});

function renderWithQueryClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

function mockResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

function mockTenantPrincipal() {
  return mockResponse({
    ok: true,
    data: {
      userId: "user-1",
      tenantId: "tenant-1",
      sessionId: "session-1",
      systemRoles: [],
      tenantRoles: ["member"],
    },
    meta: { timestamp: "2026-05-09T12:00:00.000Z" },
  });
}

describe("ClubLoginPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    navigateMock.mockClear();
  });

  it("renders a tenant club login page for unauthenticated users", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        mockResponse(
          {
            ok: false,
            error: {
              status: 401,
              code: "UNAUTHORIZED",
              message: "Unauthorized",
            },
          },
          { status: 401 },
        ),
      ),
    );

    renderWithQueryClient(<ClubLoginPage />);

    expect(
      await screen.findByRole("heading", { name: "Pong Ping Club" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Área do clube")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /entrar com google/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/administr/i)).not.toBeInTheDocument();
  });

  it("redirects authenticated tenant users to a safe internal redirect path", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(mockTenantPrincipal()),
    );

    renderWithQueryClient(<ClubLoginPage redirect="/club/settings" />);

    expect(await screen.findByTestId("tenant-redirect")).toHaveAttribute(
      "data-to",
      "/club/settings",
    );
    expect(navigateMock).toHaveBeenCalledWith("/club/settings");
  });

  it("starts tenant Google login with the safe redirect path", async () => {
    const assign = vi.fn();
    vi.stubGlobal(
      "location",
      Object.assign(new URL("http://acme.localhost.me:5173/club/login"), {
        assign,
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        mockResponse(
          {
            ok: false,
            error: {
              status: 401,
              code: "UNAUTHORIZED",
              message: "Unauthorized",
            },
          },
          { status: 401 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderWithQueryClient(<ClubLoginPage redirect="/club" />);

    await user.click(
      await screen.findByRole("button", { name: /entrar com google/i }),
    );

    expect(assign).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/auth/google?tenant=acme&returnTo=%2Fclub",
    );
  });
});
