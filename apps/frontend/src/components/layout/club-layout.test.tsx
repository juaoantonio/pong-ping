import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type * as TanStackRouter from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClubLayout } from "@/components/layout/club-layout";
import { authKeys } from "@/lib/api/system-admin";
import { tenantAuthKeys } from "@/lib/api/tenant-auth";

const { navigate, toastError, toastSuccess } = vi.hoisted(() => ({
  navigate: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof TanStackRouter>();

  return {
    ...actual,
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    Outlet: () => <div data-testid="club-outlet">Dashboard content</div>,
    useLocation: () => ({ pathname: "/club" }),
    useRouter: () => ({ navigate }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: toastError,
    success: toastSuccess,
  },
}));

function mockResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status: 200,
    ...init,
  });
}

function renderLayout(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
  queryClient.setQueryDefaults(tenantAuthKeys.me, { staleTime: Infinity });
  queryClient.setQueryData(tenantAuthKeys.me, {
    userId: "tenant-user-123456789",
    tenantId: "tenant-1",
    sessionId: "session-1",
    systemRoles: [],
    tenantRoles: ["member"],
  });
  queryClient.setQueryData(authKeys.me, {
    userId: "system-user",
    tenantId: null,
    sessionId: "system-session",
    systemRoles: ["system_admin"],
    tenantRoles: [],
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ClubLayout />
    </QueryClientProvider>,
  );
}

describe("ClubLayout", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        addEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: query,
        onchange: null,
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    navigate.mockClear();
    toastSuccess.mockClear();
    toastError.mockClear();
  });

  it("renders club shell landmarks, navigation, and principal display", () => {
    vi.stubGlobal("fetch", vi.fn());

    renderLayout();

    expect(
      screen.getByRole("link", { name: /ir para o conteudo/i }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getAllByRole("main").at(-1)).toHaveAttribute(
      "id",
      "main-content",
    );
    expect(screen.getByText("Pong Ping Club")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute(
      "href",
      "/club",
    );
    expect(screen.getByText("tenant-u...6789")).toBeInTheDocument();
    expect(screen.queryByText(/system admin/i)).not.toBeInTheDocument();
  });

  it("logs out the tenant session without clearing system auth", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        mockResponse({
          ok: true,
          data: { revoked: true },
          meta: { timestamp: "2026-05-09T12:00:00.000Z" },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    renderLayout(queryClient);
    await user.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: "/club/login" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.localhost.me:3001/v1/auth/logout",
      expect.objectContaining({ credentials: "include", method: "POST" }),
    );
    expect(queryClient.getQueryData(tenantAuthKeys.me)).toBeUndefined();
    expect(queryClient.getQueryData(authKeys.me)).toBeDefined();
    expect(toastSuccess).toHaveBeenCalledWith("Sessao encerrada.");
  });

  it("keeps the user in place when logout fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        mockResponse(
          {
            ok: false,
            error: {
              status: 500,
              code: "SERVER_ERROR",
              message: "Server error",
            },
          },
          { status: 500 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderLayout();
    await user.click(screen.getByRole("button", { name: /sair/i }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Nao foi possivel sair agora."),
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
