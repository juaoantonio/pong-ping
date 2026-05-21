import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Table2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { CorePlayModeContract, TableResponseContract } from "@pong-ping/contracts";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentCoreAthleteQuery, useCoreTablesQuery } from "@/features/club/api/queries";
import {
  useCreateCoreTableMutation,
  useEnqueueCoreTableMutation,
  useFormCoreActiveGameMutation,
  useRecordCoreGameMutation,
  useRemoveCoreActiveAthleteMutation,
  useRemoveCoreQueuedAthleteMutation,
  useRenameCoreTableMutation,
  useRotateCoreWinnerStaysMutation,
} from "@/features/club/api/mutations";
import {
  MetricTile,
  QueryState,
  SectionPanel,
  activeGameLabel,
  sideLabel,
  tableStatus,
} from "@/features/club/club-ui";
import { tenantMeQueryOptions } from "@/lib/api/tenant-auth";
import { useQuery } from "@tanstack/react-query";

export function TablesPage() {
  const tables = useCoreTablesQuery({ page: 1, pageSize: 50 });
  const athlete = useCurrentCoreAthleteQuery();
  const principal = useQuery(tenantMeQueryOptions());
  const isAdmin = principal.data?.tenantRoles.includes("admin") ?? false;
  const tableItems = tables.data?.items ?? [];

  return (
    <PageShell
      action={isAdmin ? <CreateTableForm /> : null}
      description="Controle filas, jogos ativos e resultados de cada mesa do clube."
      eyebrow="Clube"
      title="Mesas"
    >
      <QueryState
        isError={tables.isError}
        isLoading={tables.isPending}
        onRetry={() => void tables.refetch()}
      >
        <div className="grid gap-6">
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile label="Mesas cadastradas" value={tables.data?.page.totalItems ?? 0} />
            <MetricTile label="Jogos ativos" value={tableItems.filter((table) => table.activeGame).length} />
            <MetricTile label="Atletas em fila" value={tableItems.reduce((total, table) => total + table.queue.length, 0)} />
          </div>

          {tableItems.length === 0 ? (
            <EmptyState
              action={isAdmin ? undefined : <Button asChild variant="outline"><Link to="/club/profile">Ver perfil</Link></Button>}
              title="Nenhuma mesa cadastrada."
            >
              Um admin do tenant pode criar a primeira mesa para iniciar a fila do clube.
            </EmptyState>
          ) : (
            <div className="grid gap-4">
              {tableItems.map((table) => (
                <TableCard
                  currentAthleteId={athlete.data?.id}
                  isAdmin={isAdmin}
                  key={table.id}
                  table={table}
                />
              ))}
            </div>
          )}
        </div>
      </QueryState>
    </PageShell>
  );
}

function CreateTableForm() {
  const [name, setName] = useState("");
  const [playMode, setPlayMode] = useState<CorePlayModeContract>("singles");
  const createTable = useCreateCoreTableMutation();

  return (
    <form
      className="grid gap-2 sm:grid-cols-[minmax(140px,1fr)_140px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        createTable.mutate(
          { name: name.trim(), playMode },
          {
            onSuccess: () => {
              setName("");
              toast.success("Mesa criada.");
            },
            onError: () => toast.error("Nao foi possivel criar a mesa."),
          },
        );
      }}
    >
      <div className="grid gap-1">
        <Label className="sr-only" htmlFor="new-table-name">Nome da mesa</Label>
        <Input
          id="new-table-name"
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          placeholder="Mesa 1"
          value={name}
        />
      </div>
      <Select onValueChange={(value) => setPlayMode(value as CorePlayModeContract)} value={playMode}>
        <SelectTrigger aria-label="Modo de jogo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="singles">Singles</SelectItem>
          <SelectItem value="doubles">Duplas</SelectItem>
        </SelectContent>
      </Select>
      <Button disabled={createTable.isPending || !name.trim()} type="submit">
        <Plus className="size-4" />
        Criar
      </Button>
    </form>
  );
}

function TableCard({
  currentAthleteId,
  isAdmin,
  table,
}: {
  currentAthleteId?: string;
  isAdmin: boolean;
  table: TableResponseContract;
}) {
  const rename = useRenameCoreTableMutation();
  const enqueue = useEnqueueCoreTableMutation();
  const removeQueued = useRemoveCoreQueuedAthleteMutation();
  const removeActive = useRemoveCoreActiveAthleteMutation();
  const formGame = useFormCoreActiveGameMutation();
  const rotate = useRotateCoreWinnerStaysMutation();
  const recordGame = useRecordCoreGameMutation();
  const queuedAthleteIds = new Set(table.queue.map((entry) => entry.athleteId));
  const activeAthleteIds = new Set(
    table.activeGame
      ? [...table.activeGame.firstSide.athleteIds, ...table.activeGame.secondSide.athleteIds]
      : [],
  );
  const isQueued = currentAthleteId ? queuedAthleteIds.has(currentAthleteId) : false;
  const isActive = currentAthleteId ? activeAthleteIds.has(currentAthleteId) : false;

  return (
    <SectionPanel
      action={<Badge variant={table.activeGame ? "default" : "secondary"}>{tableStatus(table)}</Badge>}
      title={
        <span className="flex items-center gap-2">
          <Table2 className="size-4" />
          {table.name}
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            {table.playMode === "singles" ? "Singles" : "Duplas"} · {activeGameLabel(table.activeGame)}
          </p>
          <div className="flex flex-wrap gap-2">
            {currentAthleteId ? (
              isActive ? (
                <Button
                  disabled={removeActive.isPending}
                  onClick={() => removeActive.mutate({ tableId: table.id, athleteId: currentAthleteId })}
                  type="button"
                  variant="outline"
                >
                  <UserMinus className="size-4" />
                  Sair do jogo
                </Button>
              ) : isQueued ? (
                <Button
                  disabled={removeQueued.isPending}
                  onClick={() => removeQueued.mutate({ tableId: table.id, athleteId: currentAthleteId })}
                  type="button"
                  variant="outline"
                >
                  <UserMinus className="size-4" />
                  Sair da fila
                </Button>
              ) : (
                <Button
                  disabled={enqueue.isPending}
                  onClick={() => enqueue.mutate({ tableId: table.id })}
                  type="button"
                >
                  <UserPlus className="size-4" />
                  Entrar na fila
                </Button>
              )
            ) : null}
            <Button
              disabled={formGame.isPending || table.queue.length < (table.playMode === "singles" ? 2 : 4)}
              onClick={() => formGame.mutate({ tableId: table.id })}
              type="button"
              variant="outline"
            >
              Formar jogo
            </Button>
            {isAdmin ? (
              <Button
                onClick={() => {
                  const nextName = window.prompt("Novo nome da mesa", table.name);
                  if (!nextName?.trim() || nextName.trim() === table.name) return;
                  rename.mutate(
                    { tableId: table.id, input: { name: nextName.trim() } },
                    { onSuccess: () => toast.success("Mesa renomeada.") },
                  );
                }}
                type="button"
                variant="ghost"
              >
                Renomear
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3">
          {table.activeGame ? (
            <div className="grid gap-2 rounded-md border bg-background p-3">
              <p className="text-sm font-medium">Jogo ativo</p>
              {[table.activeGame.firstSide, table.activeGame.secondSide].map((side, index) => (
                <div className="flex flex-wrap items-center justify-between gap-2" key={side.athleteIds.join(":")}>
                  <span className="text-sm">{sideLabel(side)}</span>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!window.confirm(`Registrar vitoria do lado ${index + 1}?`)) return;
                        recordGame.mutate(
                          { tableId: table.id, input: { winningAthleteIds: side.athleteIds } },
                          {
                            onSuccess: (game) => {
                              const changes = game.ratingChanges
                                .flatMap((change) => change.changes)
                                .map((change) => `${change.athleteId} ${change.delta.points > 0 ? "+" : ""}${change.delta.points}`)
                                .join(", ");
                              toast.success(`Partida registrada. Rating: ${changes || "sem mudancas"}.`);
                            },
                          },
                        );
                      }}
                      size="sm"
                      type="button"
                    >
                      Venceu
                    </Button>
                    <Button
                      onClick={() => rotate.mutate({ tableId: table.id, input: { winningAthleteIds: side.athleteIds } })}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      Rotacionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="grid gap-2">
            <p className="text-sm font-medium">Fila</p>
            {table.queue.length > 0 ? (
              <div className="grid gap-2">
                {table.queue.map((entry) => (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-sm" key={entry.athleteId}>
                    <span>{entry.position + 1}. {entry.athleteId}</span>
                    {isAdmin || entry.athleteId === currentAthleteId ? (
                      <Button
                        disabled={removeQueued.isPending || removeActive.isPending}
                        onClick={() => {
                          const mutation = activeAthleteIds.has(entry.athleteId) ? removeActive : removeQueued;
                          mutation.mutate({ tableId: table.id, athleteId: entry.athleteId });
                        }}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        {entry.athleteId === currentAthleteId ? "Sair" : "Remover"}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Fila vazia." />
            )}
          </div>
        </div>
      </div>
    </SectionPanel>
  );
}
