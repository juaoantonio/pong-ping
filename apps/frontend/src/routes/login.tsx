import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/login-page";

type LoginSearch = {
  user?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    user: getSafeUserAlias(search.user),
  }),
  component: LoginRoute,
});

function LoginRoute() {
  const { user } = Route.useSearch();

  return <LoginPage userAlias={user} />;
}

function getSafeUserAlias(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^[a-z0-9][a-z0-9_-]{0,62}$/.test(value) ? value : undefined;
}
