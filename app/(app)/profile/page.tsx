import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/app/(app)/profile/profile-form";
import { PageShell } from "@/components/page-shell";
import { UserAvatar } from "@/components/user-avatar";
import { requireAuth } from "@/lib/auth/session";

export default async function ProfilePage() {
  const user = await requireAuth();
  const userName = user.name ?? user.email ?? "Usuario";

  return (
    <PageShell
      className="max-w-4xl"
      description="Atualize o nome exibido nas filas, historico e area administrativa."
      eyebrow="Conta"
      title="Perfil"
    >
      <section className="grid gap-4 border-b border-border/80 pb-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <UserAvatar
          className="size-12"
          name={userName}
          src={user.avatarUrl ?? user.image}
        />
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Sessao ativa</p>
          <p className="truncate text-2xl font-semibold">{userName}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </section>

      <section className="grid gap-4 border-b border-border/80 pb-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Editar perfil</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Atualize o nome exibido nas filas, historico e area administrativa.
          </p>
        </div>
        <ProfileForm initialName={user.name ?? ""} />
      </section>

      <section className="grid gap-4">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Dados validados</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Dados validados no backend a partir da sessao HTTP-only.
          </p>
        </div>
        <div className="grid gap-0 divide-y divide-border border-y border-border text-sm">
          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="break-words font-medium">{user.email}</span>
          </div>
          <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{user.role}</Badge>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
