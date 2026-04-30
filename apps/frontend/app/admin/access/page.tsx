import { AccessAdmin } from "@/app/admin/access/access-admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";

export default async function AdminAccessPage() {
  await requireRole("admin");
  const { allowedEmails, invitations } = await apiGet<{
    allowedEmails: {
      id: string;
      email: string;
      createdAt: string;
      createdBy: { name: string | null; email: string | null } | null;
    }[];
    invitations: {
      id: string;
      expiresAt: string;
      oneTimeUse: boolean;
      usedAt: string | null;
      usedByEmail: string | null;
      createdAt: string;
      status: "Disponivel" | "Usado" | "Expirado" | "Reutilizavel";
    }[];
  }>("/admin/access");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
        <h1 className="text-2xl font-semibold">Acesso</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de acesso</CardTitle>
          <CardDescription>
            Autorize emails e crie convites de login com validade curta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessAdmin
            allowedEmails={allowedEmails}
            invitations={invitations}
          />
        </CardContent>
      </Card>
    </div>
  );
}
