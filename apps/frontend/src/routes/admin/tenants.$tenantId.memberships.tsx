import { createFileRoute } from "@tanstack/react-router";
import { MembershipsPage } from "@/features/system-admin/memberships/memberships-page";

export const Route = createFileRoute("/admin/tenants/$tenantId/memberships")({
  component: MembershipsPage,
});
