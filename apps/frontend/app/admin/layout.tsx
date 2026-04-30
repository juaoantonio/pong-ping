import { AppLayout } from "@/components/app-layout";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("admin");

  return <AppLayout user={user}>{children}</AppLayout>;
}
