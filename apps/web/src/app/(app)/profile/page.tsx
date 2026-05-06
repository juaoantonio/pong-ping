import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/app/(app)/profile/profile-form";
import { PageShell } from "@/components/page-shell";
import { UserAvatar } from "@/components/user-avatar";
import { getCurrentAthleteProfile } from "@/lib/athletes/profile";
import { requireTenantUser } from "@/lib/auth/session";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});

export default async function ProfilePage() {
  const user = await requireTenantUser();
  const tenantId = user.tenantId;

  if (!tenantId) {
    throw new Error("Tenant context required for profile page.");
  }

  const athleteProfile = await getCurrentAthleteProfile(user.id, tenantId);
  const userName = user.name ?? user.email ?? "Usuario";
  const rankingStats = [
    {
      label: "Posicao interna",
      value: athleteProfile.ranking.position
        ? `#${athleteProfile.ranking.position}`
        : "Sem posicao",
    },
    { label: "Elo", value: athleteProfile.ranking.elo.toString() },
    { label: "Vitorias", value: athleteProfile.ranking.wins.toString() },
    {
      label: "Partidas",
      value: athleteProfile.ranking.totalMatches.toString(),
    },
    {
      label: "Win rate",
      value: `${athleteProfile.ranking.winRate.toFixed(0)}%`,
    },
  ];

  return (
    <PageShell
      className="max-w-4xl"
      description="Atualize dados tecnicos, equipamento e acompanhe ranking interno."
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
          <h2 className="text-lg font-semibold">Dados do atleta</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Campos editaveis do perfil esportivo e do material usado nas mesas.
          </p>
        </div>
        <ProfileForm initialProfile={athleteProfile.editable} />
      </section>

      <section className="grid gap-4 border-b border-border/80 pb-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Ranking interno</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Dados calculados a partir das partidas registradas no tenant.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {rankingStats.map((stat) => (
            <div
              className="min-w-0 border-y border-border py-3 sm:border-y-0 sm:border-l sm:pl-3"
              key={stat.label}
            >
              <p className="truncate text-xs text-muted-foreground">
                {stat.label}
              </p>
              <p className="break-words text-lg font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
        {athleteProfile.ranking.rankLevelName ? (
          <p className="text-sm text-muted-foreground">
            Nivel atual:{" "}
            <span className="font-medium text-foreground">
              {athleteProfile.ranking.rankLevelName}
            </span>
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 border-b border-border/80 pb-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Historico de evolucao</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Ultimas partidas com variacao de Elo pela perspectiva do atleta.
          </p>
        </div>
        {athleteProfile.evolution.length > 0 ? (
          <div className="grid gap-0 divide-y divide-border border-y border-border text-sm">
            {athleteProfile.evolution.map((point) => (
              <div
                className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                key={point.matchId}
              >
                <div className="min-w-0">
                  <p className="break-words font-medium">
                    {point.result === "win" ? "Vitoria" : "Derrota"} contra{" "}
                    {point.opponentName}
                  </p>
                  <p className="text-muted-foreground">
                    {dateFormatter.format(point.finishedAt)}
                  </p>
                </div>
                <p className="font-medium tabular-nums">
                  {point.oldElo} {"->"} {point.newElo}
                </p>
                <Badge
                  className="justify-self-start sm:justify-self-end"
                  variant={point.diffPoints >= 0 ? "default" : "outline"}
                >
                  {point.diffPoints >= 0 ? "+" : ""}
                  {point.diffPoints}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="border-y border-border py-4 text-sm text-muted-foreground">
            Nenhuma partida registrada para evolucao recente.
          </p>
        )}
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
