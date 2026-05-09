import { Outlet, Link, useLocation, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  authKeys,
  logoutSystemSession,
  systemMeQueryOptions,
} from "@/lib/api/system-admin";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function currentSection(pathname: string) {
  if (pathname.includes("/memberships")) {
    return "Memberships";
  }

  if (isActivePath(pathname, "/admin/tenants")) {
    return "Tenants";
  }

  return "Admin";
}

export function AdminLayout() {
  const location = useLocation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery(systemMeQueryOptions());
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
    <SidebarProvider>
      <a
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-md transition-transform focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        href="#main-content"
      >
        Ir para o conteudo
      </a>
      <AdminSidebar
        isLoggingOut={logout.isPending}
        onLogout={() => logout.mutate()}
        pathname={location.pathname}
        userId={me.data?.userId}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              to="/admin/tenants"
            >
              Sistema
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="truncate font-medium">
              {currentSection(location.pathname)}
            </span>
          </div>
        </header>
        <main
          className="flex flex-1 flex-col gap-6 p-4 lg:p-6"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar({
  isLoggingOut,
  onLogout,
  pathname,
  userId,
}: {
  isLoggingOut: boolean;
  onLogout: () => void;
  pathname: string;
  userId?: string;
}) {
  const shortUserId = userId
    ? `${userId.slice(0, 8)}...${userId.slice(-4)}`
    : "Sessao ativa";

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Pong Ping Admin">
              <Link to="/admin/tenants">
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Pong Ping Admin
                  </span>
                  <span className="truncate text-xs">Tenants e acessos</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath(pathname, "/admin/tenants")}
                  tooltip="Tenants"
                >
                  <Link to="/admin/tenants">
                    <Building2 />
                    <span>Tenants</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={shortUserId}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <UsersRound className="size-4" />
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">System admin</span>
                <span className="truncate text-xs text-muted-foreground">
                  {shortUserId}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Button
          className="justify-start group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-2"
          disabled={isLoggingOut}
          onClick={onLogout}
          type="button"
          variant="outline"
        >
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
