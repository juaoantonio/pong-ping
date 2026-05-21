import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { TablesPage } from "@/features/club/tables/tables-page";
import { coreQueryKeys } from "@/features/club/api/query-keys";
import { tenantAuthKeys } from "@/lib/api/tenant-auth";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

function renderTablesPage(roles: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  queryClient.setQueryData(coreQueryKeys.tables.list({ page: 1, pageSize: 50 }), {
    items: [
      {
        activeGame: {
          firstSide: { athleteIds: ["athlete-1"] },
          playMode: "singles",
          secondSide: { athleteIds: ["athlete-2"] },
        },
        clubId: "club-1",
        createdAt: "2026-05-20T10:00:00.000Z",
        createdByAthleteId: "athlete-1",
        id: "table-1",
        members: [],
        name: "Mesa 1",
        playMode: "singles",
        queue: [
          {
            athleteId: "athlete-1",
            joinedAt: "2026-05-20T10:00:00.000Z",
            position: 0,
          },
          {
            athleteId: "athlete-2",
            joinedAt: "2026-05-20T10:01:00.000Z",
            position: 1,
          },
          {
            athleteId: "athlete-3",
            joinedAt: "2026-05-20T10:02:00.000Z",
            position: 2,
          },
        ],
      },
    ],
    page: {
      page: 1,
      pageSize: 50,
      totalItems: 1,
      totalPages: 1,
    },
  });
  queryClient.setQueryData(coreQueryKeys.athletes.me(), {
    clubId: "club-1",
    displayName: "Nico Pong",
    id: "athlete-1",
    profile: null,
    userId: "user-1",
  });
  queryClient.setQueryData(tenantAuthKeys.me, {
    sessionId: "session-1",
    systemRoles: [],
    tenantId: "club-1",
    tenantRoles: roles,
    userId: "user-1",
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TablesPage />
    </QueryClientProvider>,
  );
}

describe("TablesPage", () => {
  it("mostra apenas a remocao propria para membro", () => {
    renderTablesPage(["member"]);

    expect(screen.getByRole("button", { name: /sair do jogo/i })).toBeInTheDocument();
    expect(screen.getByText("3. athlete-3")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  });

  it("mostra remocao de terceiros para admin", () => {
    renderTablesPage(["admin"]);

    const thirdAthleteRow = screen.getByText("3. athlete-3").closest("div");

    expect(thirdAthleteRow).not.toBeNull();
    expect(within(thirdAthleteRow as HTMLElement).getByRole("button", { name: "Remover" })).toBeInTheDocument();
  });
});
