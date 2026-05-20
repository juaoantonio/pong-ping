import { useQuery } from "@tanstack/react-query";
import { RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCorrectCoreGameMutation } from "@/features/club/api/mutations";
import { useCoreGamesQuery } from "@/features/club/api/queries";
import { GameSummary, QueryState } from "@/features/club/club-ui";
import { formatDateTime } from "@/lib/format";
import { tenantMeQueryOptions } from "@/lib/api/tenant-auth";

export function GamesPage() {
  const games = useCoreGamesQuery({ page: 1, pageSize: 50 });
  const principal = useQuery(tenantMeQueryOptions());
  const isAdmin = principal.data?.tenantRoles.includes("admin") ?? false;
  const correctGame = useCorrectCoreGameMutation();
  const items = games.data?.items ?? [];

  return (
    <PageShell
      description="Historico de partidas registradas, marcadores de correcao e deltas de rating."
      eyebrow="Clube"
      title="Partidas"
    >
      <QueryState
        isError={games.isError}
        isLoading={games.isPending}
        onRetry={() => void games.refetch()}
      >
        {items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partida</TableHead>
                  <TableHead>Mesa</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin ? <TableHead className="text-right">Acao</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell>
                      <GameSummary game={game} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{game.tableId}</TableCell>
                    <TableCell className="text-sm">
                      {game.ratingChanges.flatMap((change) => change.changes).map((change) => (
                        <span className="mr-2 whitespace-nowrap" key={`${game.id}:${change.athleteId}`}>
                          {change.athleteId}: {change.delta.points > 0 ? "+" : ""}
                          {change.delta.points}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {game.isCorrection ? <Badge variant="secondary">Correcao</Badge> : null}
                        {game.correctionId ? <Badge variant="outline">Corrigido</Badge> : null}
                        {!game.isCorrection && !game.correctionId ? <Badge>Original</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(game.finishedAt)}
                      </p>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-right">
                        <Button
                          disabled={game.isCorrection || Boolean(game.correctionId) || correctGame.isPending}
                          onClick={() => {
                            if (!window.confirm("Registrar correcao compensatoria para esta partida?")) return;
                            correctGame.mutate(
                              { gameRecordId: game.id },
                              { onSuccess: () => toast.success("Correcao registrada.") },
                            );
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw className="size-4" />
                          Corrigir
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={() => void games.refetch()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                Recarregar
              </Button>
            }
            title="Nenhuma partida registrada."
          >
            Registre o vencedor de uma mesa ativa para alimentar o historico e o ranking.
          </EmptyState>
        )}
      </QueryState>
    </PageShell>
  );
}
