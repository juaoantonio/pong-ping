import { Outlet, Link, useLocation, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authKeys, logoutSystemSession, systemMeQueryOptions } from "@/lib/api/system-admin";
import { cn } from "@/lib/utils";

function navItemClass(active: boolean) {
  return cn(
    "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-primary text-sidebar-primary-foreground"
      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );
}

export function AdminLayout() {
  const location = useLocation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useMutation({
    mutationFn: logoutSystemSession,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: authKeys.me });
      toast.success("Sessao encerrada.");
      await router.navigate({ to: "/login" });
    },
    onError: () => toast.error("Nao foi possivel sair agora."),
  });

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-md transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        href="#main-content"
      >
        Ir para o conteudo
      </a>
      <header className="sticky top-0 z-20 border-b bg-sidebar/95 text-sidebar-foreground backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Link className="mr-auto inline-flex min-w-0 items-center gap-3" to="/admin/tenants">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="size-5" />
            </span>
            <span className="grid min-w-0 leading-tight">
              <span className="truncate font-semibold">Pong Ping Admin</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Sistema">
            <Link
              className={navItemClass(location.pathname.startsWith("/admin/tenants"))}
              to="/admin/tenants"
            >
              <Building2 className="size-4" />
              Tenants
            </Link>
          </nav>
          <Separator className="hidden h-5 sm:block" orientation="vertical" />
          <Button
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            size="sm"
            type="button"
            variant="outline"
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>
      <main className="px-4 py-6 lg:px-6" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-6 text-xs text-muted-foreground lg:px-6">
        <UsersRound className="size-3.5" />
        Administracao global de tenants e acessos.
      </footer>
    </div>
  );
}
