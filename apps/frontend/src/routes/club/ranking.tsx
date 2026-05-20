import { createFileRoute } from "@tanstack/react-router";
import { RankingPage } from "@/features/club/ranking/ranking-page";

export const Route = createFileRoute("/club/ranking")({
  component: RankingPage,
});
