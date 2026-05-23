import { createFileRoute } from "@tanstack/react-router";
import { ClubLoginPage } from "@/features/tenant-auth/club-login-page";

type ClubLoginSearch = {
  redirect?: string;
  user?: string;
};

export const Route = createFileRoute("/club_/login")({
  validateSearch: (search: Record<string, unknown>): ClubLoginSearch => {
    const redirect = typeof search.redirect === "string" ? search.redirect : undefined;

    if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
      return { user: getSafeUserAlias(search.user) };
    }

    return { redirect, user: getSafeUserAlias(search.user) };
  },
  component: ClubLoginRoute,
});

function ClubLoginRoute() {
  const { redirect, user } = Route.useSearch();

  return <ClubLoginPage redirect={redirect} userAlias={user} />;
}

function getSafeUserAlias(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(value) ? value : undefined;
}
