import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardShellPage } from "@/features/club/dashboard-shell-page";

describe("DashboardShellPage", () => {
  it("renders the club dashboard placeholder", () => {
    render(<DashboardShellPage />);

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Clube conectado")).toBeInTheDocument();
    expect(screen.getByText("Acesso validado")).toBeInTheDocument();
    expect(screen.getByText("Operacional")).toBeInTheDocument();
  });
});
