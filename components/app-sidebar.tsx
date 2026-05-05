"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BetweenHorizonalStart,
  Building2,
  Home,
  LogOut,
  Shield,
  Swords,
  Trophy,
  UserRound,
  Users2,
} from "lucide-react";
import { useAuthenticatedUser } from "@/components/auth/authenticated-user-provider";
import { LogoutButton } from "@/components/logout-button";
import { UserAvatar } from "@/components/user-avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { canAccessAdmin, isSuperAdmin } from "@/lib/auth/roles";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuthenticatedUser();
  const userName = user.name ?? user.email ?? "Usuario";
  const tenantName = user.tenantName ?? "Pong Ping";
  const canUseAdmin = canAccessAdmin(user.role);
  const canUseRoundManagement = isSuperAdmin(user);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={tenantName}>
              <Link href="/">
                <span className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                  <Trophy className="size-4" />
                </span>
                <span className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{tenantName}</span>
                  <span className="truncate text-xs">Ranking e mesas</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Ranking"
                >
                  <Link href="/">
                    <Home />
                    <span>Ranking</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActivePath(pathname, "/tables")}
                  tooltip="Mesas"
                >
                  <Link href="/tables">
                    <BetweenHorizonalStart />
                    <span>Mesas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/profile"}
                  tooltip="Perfil"
                >
                  <Link href="/profile">
                    <UserRound />
                    <span>Perfil</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canUseAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin/users"}
                >
                  <Link href="/admin/users">
                    {" "}
                    <Users2 /> Usuários
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin/access"}
                >
                  <Link href="/admin/access">
                    <Shield /> Acesso
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {canUseRoundManagement ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/tenants"}
                  >
                    <Link href="/admin/tenants">
                      <Building2 />
                      Tenants
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
              {canUseRoundManagement ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/admin/rounds"}
                  >
                    <Link href="/admin/rounds">
                      <Swords />
                      Rodadas
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={userName}>
              <UserAvatar
                className="size-8"
                name={userName}
                src={user.avatarUrl}
              />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email ?? user.role}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <LogoutButton icon={<LogOut className="size-4" />} />
      </SidebarFooter>
    </Sidebar>
  );
}
