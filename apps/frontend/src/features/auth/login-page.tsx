import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSystemLoginUrl } from "@/lib/api/client";
import { systemMeQueryOptions } from "@/lib/api/system-admin";

type LoginPageProps = {
  userAlias?: string;
};

export function LoginPage({ userAlias }: LoginPageProps) {
  const me = useQuery({ ...systemMeQueryOptions(), retry: false });

  if (me.isSuccess) {
    return <Navigate to="/admin/tenants" />;
  }

  return (
    <main className="grid min-h-svh place-items-center bg-background px-4 py-10 text-foreground">
      <section className="grid w-full max-w-sm gap-7">
        <div className="grid gap-4">
          <span className="flex size-12 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="size-6" />
          </span>
          <div className="grid gap-2">
            <p className="text-sm font-medium text-muted-foreground">Painel administrativo</p>
            <h1 className="text-4xl font-semibold tracking-normal">Pong Ping Admin</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Acesse com a conta Google autorizada como administradora do sistema.
            </p>
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => window.location.assign(getSystemLoginUrl({ userAlias }))}
        >
          <LogIn className="size-4" />
          Entrar com Google
        </Button>
      </section>
    </main>
  );
}
