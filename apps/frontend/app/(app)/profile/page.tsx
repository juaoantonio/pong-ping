import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/app/(app)/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { requireAuth } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await requireAuth();
  const userName = user.name ?? user.email ?? "Usuario";

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex items-center gap-4">
        <UserAvatar
          className="size-12"
          name={userName}
          src={user.avatarUrl}
        />
        <div>
          <p className="text-sm text-muted-foreground">Sessao ativa</p>
          <h1 className="text-2xl font-semibold">{userName}</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar perfil</CardTitle>
          <CardDescription>
            Atualize o nome exibido nas filas, historico e area administrativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialName={user.name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>
            Dados validados no backend a partir da sessao HTTP-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
