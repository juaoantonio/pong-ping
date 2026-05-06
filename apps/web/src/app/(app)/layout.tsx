import { Suspense } from "react";
import { AppLayout, AppLayoutSkeleton } from "@/components/app-layout";
import { requireAuth } from "@/lib/auth/session";

async function AuthenticatedShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return <AppLayout user={user}>{children}</AppLayout>;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppLayoutSkeleton>{children}</AppLayoutSkeleton>}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
