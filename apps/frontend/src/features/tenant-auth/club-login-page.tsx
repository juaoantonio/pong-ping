import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { LogIn, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTenantLoginUrl, tenantMeQueryOptions } from "@/lib/api/tenant-auth";

type ClubLoginPageProps = {
  redirect?: string;
  userAlias?: string;
};

export function ClubLoginPage({ redirect, userAlias }: ClubLoginPageProps) {
  const me = useQuery({ ...tenantMeQueryOptions(), retry: false });
  const destination = redirect ?? "/club";

  if (me.isSuccess) {
    return <Navigate to={destination} />;
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 py-10 text-foreground">
      <section className="grid w-full max-w-sm gap-7">
        <div className="grid gap-4">
          <span className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md">
            <Trophy className="size-6" />
          </span>
          <div className="grid gap-2">
            <p className="text-sm font-medium text-muted-foreground">Área do clube</p>
            <h1 className="break-words text-4xl font-semibold tracking-normal">Pong Ping Club</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Acesse o workspace do seu clube com a conta Google vinculada à sua associação.
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => window.location.assign(getTenantLoginUrl(destination, { userAlias }))}
        >
          <LogIn className="size-4" />
          Entrar com Google
        </Button>
      </section>
    </main>
  );
}
