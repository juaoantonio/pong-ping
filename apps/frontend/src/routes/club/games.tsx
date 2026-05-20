import { createFileRoute } from "@tanstack/react-router";
import { GamesPage } from "@/features/club/games/games-page";

export const Route = createFileRoute("/club/games")({
  component: GamesPage,
});
