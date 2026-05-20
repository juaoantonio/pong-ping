import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/features/club/profile/profile-page";

export const Route = createFileRoute("/club/profile")({
  component: ProfilePage,
});
