import { createFileRoute } from "@tanstack/react-router";
import { AthletesPage } from "@/features/club/athletes/athletes-page";

export const Route = createFileRoute("/club/athletes")({
  component: AthletesPage,
});
