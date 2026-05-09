import { createFileRoute } from "@tanstack/react-router";
import { DashboardShellPage } from "@/features/club/dashboard-shell-page";

export const Route = createFileRoute("/club/")({
  component: DashboardShellPage,
});
