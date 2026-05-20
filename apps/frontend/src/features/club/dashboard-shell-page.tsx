import { Link } from "@tanstack/react-router";
import { Activity, ListOrdered, RefreshCw, Table2, Trophy } from "lucide-react";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCoreDashboardQuery } from "@/features/club/api/queries";
import {
  GameSummary,
  MetricTile,
  QueryState,
  SectionPanel,
  activeGameLabel,
  tableStatus,
  winRateLabel,
} from "@/features/club/club-ui";

export function DashboardShellPage() {
  const dashboard = useCoreDashboardQuery();
  const data = dashboard.data;

  return (
    <PageShell
      description="Operacao do clube em tempo real: mesas, fila, ranking e ultimas partidas."
      eyebrow="Clube"
      title="Dashboard"
    >
      <QueryState
        isError={dashboard.isError}
        isLoading={dashboard.isPending}
        onRetry={() => void dashboard.refetch()}
      >
        {data ? (
          <div className="grid gap-6">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricTile label="Mesas" value={data.tables.totalTables} />
              <MetricTile label="Mesas ativas" tone="strong" value={data.tables.activeTables} />
              <MetricTile label="Atletas" value={data.activeAthleteCount} />
              <MetricTile label="Na fila" value={data.tables.queuedAthletes} />
            </div>

            {data.tables.totalTables === 0 &&
            data.activeAthleteCount === 0 &&
            data.recentGames.length === 0 ? (
              <EmptyState
                action={
                  <Button asChild type="button">
                    <Link to="/club/tables">
                      <Table2 className="size-4" />
                      Criar primeira mesa
                    </Link>
                  </Button>
                }
                title="O clube ainda nao tem atividade operacional."
              >
                Comece criando uma mesa. Depois os membros podem entrar na fila e registrar partidas.
              </EmptyState>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
              <SectionPanel
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/club/tables">Ver mesas</Link>
                  </Button>
                }
                title={
                  <span className="flex items-center gap-2">
                    <Activity className="size-4" />
                    Mesas
                  </span>
                }
              >
                {data.tables.tables.length > 0 ? (
                  <div className="grid gap-3">
                    {data.tables.tables.map((table) => (
                      <div
                        className="grid gap-2 rounded-md border bg-background px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        key={table.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{table.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {activeGameLabel(table.activeGame)}
                          </p>
                        </div>
                        <Badge variant={table.activeGame ? "default" : "secondary"}>
                          {tableStatus(table)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Nenhuma mesa cadastrada." />
                )}
              </SectionPanel>

              <SectionPanel
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link to="/club/ranking">Ranking</Link>
                  </Button>
                }
                title={
                  <span className="flex items-center gap-2">
                    <Trophy className="size-4" />
                    Top ranking
                  </span>
                }
              >
                {data.ranking.length > 0 ? (
                  <div className="grid gap-2">
                    {data.ranking.map((rating, index) => (
                      <div className="flex items-center justify-between gap-3 text-sm" key={rating.athleteId}>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {index + 1}. {rating.athleteDisplayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rating.wins}/{rating.totalMatches} · {winRateLabel(rating.winRate)}
                          </p>
                        </div>
                        <span className="font-semibold">{rating.points}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Ranking vazio." />
                )}
              </SectionPanel>
            </div>

            <SectionPanel
              action={
                <Button asChild size="sm" variant="outline">
                  <Link to="/club/games">Historico</Link>
                </Button>
              }
              title={
                <span className="flex items-center gap-2">
                  <ListOrdered className="size-4" />
                  Partidas recentes
                </span>
              }
            >
              {data.recentGames.length > 0 ? (
                <div className="grid gap-3">
                  {data.recentGames.map((game) => (
                    <GameSummary game={game} key={game.id} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhuma partida registrada." />
              )}
            </SectionPanel>
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={() => void dashboard.refetch()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                Recarregar
              </Button>
            }
            title="Dashboard indisponivel."
          />
        )}
      </QueryState>
    </PageShell>
  );
}
