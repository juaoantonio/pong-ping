import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/layout/admin-layout";
import { ApiClientError } from "@/lib/api/errors";
import { authKeys, systemMeQueryOptions } from "@/lib/api/system-admin";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(systemMeQueryOptions());
    } catch (error) {
      if (!(error instanceof ApiClientError) || ![401, 403].includes(error.status)) {
        throw error;
      }

      context.queryClient.removeQueries({ queryKey: authKeys.me });
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AdminLayout,
});
