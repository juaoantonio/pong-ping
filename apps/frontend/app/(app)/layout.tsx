import { AppLayout } from "@/components/app-layout";
import { requireAuth } from "@/lib/auth/session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return <AppLayout user={user}>{children}</AppLayout>;
}
