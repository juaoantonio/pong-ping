import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { DashboardShellPage } from "@/features/club/dashboard-shell-page";
import { coreQueryKeys } from "@/features/club/api/query-keys";

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(coreQueryKeys.dashboard(), {
    activeAthleteCount: 3,
    ranking: [
      {
        athleteDisplayName: "Nico Pong",
        athleteId: "athlete-1",
        points: 1040,
        tier: null,
        totalMatches: 4,
        winRate: 75,
        wins: 3,
      },
    ],
    recentGames: [],
    tables: {
      activeTables: 1,
      queuedAthletes: 2,
      tables: [
        {
          activeGame: null,
          clubId: "club-1",
          createdAt: "2026-05-20T10:00:00.000Z",
          createdByAthleteId: "athlete-1",
          id: "table-1",
          members: [],
          name: "Mesa 1",
          playMode: "singles",
          queue: [],
        },
      ],
      totalTables: 1,
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardShellPage />
    </QueryClientProvider>,
  );
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

describe("DashboardShellPage", () => {
  it("renders the API-backed club dashboard", () => {
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByText("Mesas").length).toBeGreaterThan(0);
    expect(screen.getByText("Mesa 1")).toBeInTheDocument();
    expect(screen.getByText(/Nico Pong/)).toBeInTheDocument();
    expect(screen.getByText("Nenhuma partida registrada.")).toBeInTheDocument();
  });
});
