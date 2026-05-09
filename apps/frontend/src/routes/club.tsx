import { createFileRoute, redirect } from "@tanstack/react-router";
import { ClubLayout } from "@/components/layout/club-layout";
import { ApiClientError } from "@/lib/api/errors";
import { tenantAuthKeys, tenantMeQueryOptions } from "@/lib/api/tenant-auth";

export const Route = createFileRoute("/club")({
  beforeLoad: async ({ context, location }) => {
    try {
      await context.queryClient.ensureQueryData(tenantMeQueryOptions());
    } catch (error) {
      if (!(error instanceof ApiClientError) || ![401, 403].includes(error.status)) {
        throw error;
      }

      context.queryClient.removeQueries({ queryKey: tenantAuthKeys.me });
      throw redirect({
        to: "/club/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: ClubLayout,
});
