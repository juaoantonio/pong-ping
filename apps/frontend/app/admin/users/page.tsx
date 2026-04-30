import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsersAdmin } from "@/app/admin/users/users-admin";
import { requireRole } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";

export default async function AdminUsersPage() {
  const currentUser = await requireRole("admin");
  const { users } = await apiGet<{
    users: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
      role: "superadmin" | "admin" | "user";
      createdAt: string;
    }[];
  }>("/admin/users");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de usuarios</CardTitle>
          <CardDescription>
            Admins visualizam apenas users. Superadmins visualizam todos e podem
            alterar roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersAdmin
            currentUser={{ id: currentUser.id, role: currentUser.role }}
            users={users}
          />
        </CardContent>
      </Card>
    </div>
  );
}
