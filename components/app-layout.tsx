import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthenticatedUserProvider } from "@/components/auth/authenticated-user-provider";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  toClientAuthenticatedUser,
  type AuthenticatedUser,
} from "@/lib/auth/session";

type AppLayoutProps = {
  children: React.ReactNode;
  user: AuthenticatedUser;
};

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <AuthenticatedUserProvider initialUser={toClientAuthenticatedUser(user)}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator className="mr-2 h-4" orientation="vertical" />
            <AppBreadcrumbs />
          </header>
          <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthenticatedUserProvider>
  );
}

export function AppLayoutSkeleton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex min-h-12 items-center gap-3 px-2">
                <Skeleton className="size-8 rounded-md" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="gap-3">
            <Skeleton className="h-4 w-20" />
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-8 w-full" key={index} />
              ))}
            </div>
          </SidebarGroup>
          <SidebarGroup className="gap-3">
            <Skeleton className="h-4 w-16" />
            <div className="grid gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-8 w-full" key={index} />
              ))}
            </div>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 px-2 py-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator className="mr-2 h-4" orientation="vertical" />
          <Skeleton className="h-4 w-44" />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
