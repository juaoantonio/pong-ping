import { createFileRoute } from "@tanstack/react-router";
import { ClubLoginPage } from "@/features/tenant-auth/club-login-page";

type ClubLoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/club_/login")({
  validateSearch: (search: Record<string, unknown>): ClubLoginSearch => {
    const redirect = typeof search.redirect === "string" ? search.redirect : undefined;

    if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
      return {};
    }

    return { redirect };
  },
  component: ClubLoginRoute,
});

function ClubLoginRoute() {
  const { redirect } = Route.useSearch();

  return <ClubLoginPage redirect={redirect} />;
}
