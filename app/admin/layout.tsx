import { Suspense } from "react";
import { AppLayout, AppLayoutSkeleton } from "@/components/app-layout";
import { requireRole } from "@/lib/auth/session";

async function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return <AppLayout user={user}>{children}</AppLayout>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppLayoutSkeleton>{children}</AppLayoutSkeleton>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
