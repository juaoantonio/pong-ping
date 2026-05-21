import { Outlet, Link, useLocation, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Home, ListOrdered, LogOut, Table2, Trophy, UserRound, UsersRound } from "lucide-react";
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
  logoutTenantSession,
  tenantAuthKeys,
  tenantMeQueryOptions,
} from "@/lib/api/tenant-auth";
import { useCurrentCoreClubQuery } from "@/features/club/api/queries";

function isActivePath(pathname: string, href: string) {
  if (href === "/club") return pathname === href || pathname === "/club/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function shortId(value?: string) {
  return value ? `${value.slice(0, 8)}...${value.slice(-4)}` : "Sessao ativa";
}

export function ClubLayout() {
  const location = useLocation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const me = useQuery(tenantMeQueryOptions());
  const club = useCurrentCoreClubQuery();
  const clubName = club.data?.name ?? "Pong Ping Club";
  const logout = useMutation({
    mutationFn: logoutTenantSession,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: tenantAuthKeys.me });
      toast.success("Sessao encerrada.");
      await router.navigate({ to: "/club/login" });
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
      <ClubSidebar
        isLoggingOut={logout.isPending}
        onLogout={() => logout.mutate()}
        pathname={location.pathname}
        clubName={clubName}
        userId={me.data?.userId}
      />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <Link className="text-muted-foreground transition-colors hover:text-foreground" to="/club">
              {clubName}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="truncate font-medium">Dashboard</span>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ClubSidebar({
  isLoggingOut,
  onLogout,
  pathname,
  clubName,
  userId,
}: {
  isLoggingOut: boolean;
  onLogout: () => void;
  pathname: string;
  clubName: string;
  userId?: string;
}) {
  const userLabel = shortId(userId);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={clubName}>
              <Link to="/club">
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Trophy className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{clubName}</span>
                  <span className="truncate text-xs">Workspace do clube</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Clube</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { href: "/club", icon: Home, label: "Dashboard" },
                { href: "/club/tables", icon: Table2, label: "Mesas" },
                { href: "/club/ranking", icon: Trophy, label: "Ranking" },
                { href: "/club/games", icon: ListOrdered, label: "Partidas" },
                { href: "/club/athletes", icon: UsersRound, label: "Atletas" },
                { href: "/club/profile", icon: Dumbbell, label: "Perfil" },
              ].map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item.href)}
                    tooltip={item.label}
                  >
                    <Link to={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={userLabel}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
                <UserRound className="size-4" />
              </span>
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Membro do clube</span>
                <span className="truncate text-xs text-muted-foreground">{userLabel}</span>
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
