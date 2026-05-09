import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { TenantListPage } from "@/features/system-admin/tenants/tenant-list-page";

export const Route = createFileRoute("/admin/tenants")({
  component: TenantsRoute,
});

function TenantsRoute() {
  const location = useLocation();
  return location.pathname === "/admin/tenants" ? <TenantListPage /> : <Outlet />;
}
