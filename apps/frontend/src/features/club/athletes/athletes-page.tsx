import { RefreshCw, UsersRound } from "lucide-react";
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
import { useCoreAthletesQuery } from "@/features/club/api/queries";
import { QueryState, profileSummary, profileValue } from "@/features/club/club-ui";

export function AthletesPage() {
  const athletes = useCoreAthletesQuery({ page: 1, pageSize: 50 });
  const items = athletes.data?.items ?? [];

  return (
    <PageShell
      description="Lista de atletas do tenant com dados tecnicos e equipamento."
      eyebrow="Clube"
      title="Atletas"
    >
      <QueryState
        isError={athletes.isError}
        isLoading={athletes.isPending}
        onRetry={() => void athletes.refetch()}
      >
        {items.length > 0 ? (
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Equipamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UsersRound className="size-4 text-muted-foreground" />
                        <span className="font-medium">{athlete.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{profileSummary(athlete.profile)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {profileValue(athlete.profile.bladeName)} ·{" "}
                      {profileValue(athlete.profile.forehandRubberName)} ·{" "}
                      {profileValue(athlete.profile.backhandRubberName)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            action={
              <Button onClick={() => void athletes.refetch()} type="button" variant="outline">
                <RefreshCw className="size-4" />
                Recarregar
              </Button>
            }
            title="Nenhum atleta encontrado."
          >
            Os atletas aparecem quando membros autenticados sao vinculados ao clube.
          </EmptyState>
        )}
      </QueryState>
    </PageShell>
  );
}
