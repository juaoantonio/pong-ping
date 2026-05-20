import { RefreshCw, Trophy } from "lucide-react";
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
import { useCoreRatingsQuery } from "@/features/club/api/queries";
import { QueryState, winRateLabel } from "@/features/club/club-ui";

export function RankingPage() {
  const ratings = useCoreRatingsQuery({ page: 1, pageSize: 50 });
  const items = ratings.data?.items ?? [];

  return (
    <PageShell
      description="Classificacao por pontos, vitorias, partidas e aproveitamento."
      eyebrow="Clube"
      title="Ranking"
    >
      <QueryState
        isError={ratings.isError}
        isLoading={ratings.isPending}
        onRetry={() => void ratings.refetch()}
      >
        {items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posicao</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Vitorias</TableHead>
                  <TableHead>Partidas</TableHead>
                  <TableHead>Aproveitamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((rating, index) => (
                  <TableRow key={rating.athleteId}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        <Trophy className="size-3" />
                        {index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rating.athleteDisplayName}</TableCell>
                    <TableCell>{rating.points}</TableCell>
                    <TableCell>{rating.wins}</TableCell>
                    <TableCell>{rating.totalMatches}</TableCell>
                    <TableCell>{winRateLabel(rating.winRate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={() => void ratings.refetch()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                Recarregar
              </Button>
            }
            title="Ranking vazio."
          >
            O ranking sera preenchido depois que partidas forem registradas.
          </EmptyState>
        )}
      </QueryState>
    </PageShell>
  );
}
