"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  Loader2,
  MonitorUp,
  Plus,
  RotateCcw,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { type ReactNode, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { formatDateTime, readApiError, userLabel } from "@/lib/client-utils";
import type {
  TableParticipant,
  TableSummary,
  UserIdentityLike,
} from "@/components/tables/types";

type TableDetailProps = {
  canManage: boolean;
  table: TableSummary;
};

function UserIdentity({ user }: { user: UserIdentityLike }) {
  const label = userLabel(user);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar className="size-9" name={label} src={user.avatarUrl} />
      <div className="min-w-0">
        <p className="truncate font-medium">{label}</p>
        {user.email ? (
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        ) : null}
      </div>
    </div>
  );
}

function CurrentRoundSlot({
  isViewer,
  participant,
  slot,
}: {
  isViewer: boolean;
  participant?: TableParticipant;
  slot: string;
}) {
  if (!participant) {
    return (
      <div className="grid min-h-40 content-between gap-4 py-4 sm:min-h-48 sm:gap-5 sm:py-5 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="secondary">{slot}</Badge>
          <Badge variant="outline">Livre</Badge>
        </div>
        <div className="grid justify-items-center gap-3 text-center">
          <div
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-full border border-dashed border-border text-xl text-muted-foreground sm:size-20 sm:text-2xl"
          >
            ?
          </div>
          <div className="grid gap-1">
            <p className="text-lg font-semibold text-muted-foreground sm:text-xl">
              Aguardando jogador
            </p>
            <p className="text-sm text-muted-foreground">
              Próximo da fila entra aqui.
            </p>
          </div>
        </div>
        <div aria-hidden="true" />
      </div>
    );
  }

  const label = userLabel(participant.user);

  return (
    <div className="grid min-h-40 content-between gap-4 py-4 sm:min-h-48 sm:gap-5 sm:py-5 md:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{slot}</Badge>
          {isViewer ? <Badge>Você</Badge> : null}
        </div>
        <Badge className="shrink-0 text-sm tabular-nums" variant="outline">
          {participant.user.playerRanking?.elo ?? 1000} Elo
        </Badge>
      </div>
      <div className="grid min-w-0 justify-items-center gap-4 text-center">
        <UserAvatar
          className="size-20 text-2xl sm:size-24 sm:text-3xl"
          name={label}
          src={participant.user.avatarUrl}
        />
        <div className="grid min-w-0 gap-1">
          <p className="max-w-full truncate text-xl font-semibold sm:text-2xl">
            {label}
          </p>
          {participant.user.email ? (
            <p className="max-w-full truncate text-sm text-muted-foreground">
              {participant.user.email}
            </p>
          ) : null}
        </div>
      </div>
      <div aria-hidden="true" />
    </div>
  );
}

function WorkflowSection({
  action,
  children,
  className,
  description,
  icon,
  title,
}: {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className={className}>
      <header className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            {icon}
            <span className="min-w-0 truncate">{title}</span>
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children ? <div className="pt-4">{children}</div> : null}
    </section>
  );
}

export function TableDetail({ canManage, table }: TableDetailProps) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentMatch = table.participants.slice(0, 2);
  const queuedParticipants = table.participants.slice(2);
  const roundIsActive = currentMatch.length === 2;
  const actionDisabled = isPending || busyKey !== null;
  const viewerQueuePosition =
    table.viewerQueuePosition === null ? null : table.viewerQueuePosition + 1;

  function runAction(actionKey: string, callback: () => Promise<void>) {
    setBusyKey(actionKey);

    startTransition(async () => {
      try {
        await callback();
      } finally {
        setBusyKey(null);
      }
    });
  }

  function joinQueue() {
    runAction("join-queue", async () => {
      const response = await fetch(`/api/tables/${table.id}/queue`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Você entrou na fila.");
      router.refresh();
    });
  }

  function leaveQueue() {
    runAction("leave-queue", async () => {
      const response = await fetch(`/api/tables/${table.id}/queue`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Você saiu da fila.");
      router.refresh();
    });
  }

  function leaveCurrentRound() {
    runAction("leave-current-round", async () => {
      const response = await fetch(`/api/tables/${table.id}/seat`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Voce saiu da mesa sem encerrar a rodada.");
      router.refresh();
    });
  }

  function removeParticipant(participantId: string) {
    runAction(`remove-participant:${participantId}`, async () => {
      const response = await fetch(
        `/api/admin/tables/${table.id}/participants/${participantId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Jogador removido da fila.");
      router.refresh();
    });
  }

  function finishMatch(winnerParticipantId: string, winnerName: string) {
    runAction(`finish-match:${winnerParticipantId}`, async () => {
      const response = await fetch(`/api/admin/tables/${table.id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerParticipantId }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success(
        `Rodada encerrada. ${winnerName} venceu e o Elo foi recalculado.`,
      );
      router.refresh();
    });
  }

  function rollbackMatch(matchId: string) {
    runAction(`rollback-match:${matchId}`, async () => {
      const response = await fetch(
        `/api/admin/tables/${table.id}/matches/${matchId}/rollback`,
        { method: "POST" },
      );

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Rodada revertida com registro de auditoria.");
      router.refresh();
    });
  }

  return (
    <div className="grid min-w-0 gap-7 sm:gap-8">
      <Button asChild className="w-fit px-0" size="sm" variant="link">
        <Link href="/tables">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Voltar para mesas
        </Link>
      </Button>

      <section className="min-w-0 border-y border-border py-5 md:py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          <div className="grid min-w-0 gap-5">
            <header className="grid min-w-0 gap-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant={roundIsActive ? "default" : "secondary"}>
                  {roundIsActive ? "Mesa ativa" : "Aguardando jogador"}
                </Badge>
                <Badge variant="outline">
                  {queuedParticipants.length} aguardando
                </Badge>
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-2xl font-semibold text-balance">
                  {table.name}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {roundIsActive
                    ? "Rodada em andamento. Vencedor permanece na mesa; perdedor volta para o fim da fila."
                    : "A mesa precisa de 2 jogadores para iniciar a rodada."}
                </p>
              </div>
            </header>

            <div className="grid min-w-0 border-y border-border md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:divide-x md:divide-y-0 md:divide-border">
              <CurrentRoundSlot
                isViewer={currentMatch[0]?.user.id === table.viewerUserId}
                participant={currentMatch[0]}
                slot="Jogador 1"
              />
              <div className="grid place-items-center border-y border-border py-3 md:border-y-0 md:px-4">
                <Badge className="px-4 py-2 text-base" variant="outline">
                  vs
                </Badge>
              </div>
              <CurrentRoundSlot
                isViewer={currentMatch[1]?.user.id === table.viewerUserId}
                participant={currentMatch[1]}
                slot="Jogador 2"
              />
            </div>
          </div>

          <aside className="grid min-w-0 gap-4 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="grid gap-1">
              <p className="text-sm font-medium">Próxima ação</p>
              {table.viewerIsPlaying ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Você está jogando agora. Use os controles; a saída da fila
                  fica bloqueada até a rodada terminar.
                </p>
              ) : table.viewerIsQueued ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  Você está na posição{" "}
                  <span className="font-medium text-foreground tabular-nums">
                    #{viewerQueuePosition ?? "-"}
                  </span>
                  . Aguarde sua vez ou saia da fila.
                </p>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  Entre na fila desta mesa quando estiver pronto para jogar.
                </p>
              )}
            </div>

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              {table.viewerIsPlaying ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={actionDisabled}
                  onClick={leaveCurrentRound}
                  size="lg"
                  variant="outline"
                >
                  {busyKey === "leave-current-round" ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <LogOut aria-hidden="true" className="size-4" />
                  )}
                  Sair da Mesa
                </Button>
              ) : table.viewerIsQueued ? (
                <Button
                  disabled={actionDisabled}
                  className="w-full sm:w-auto"
                  onClick={leaveQueue}
                  size="lg"
                  variant="outline"
                >
                  {busyKey === "leave-queue" ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <LogOut aria-hidden="true" className="size-4" />
                  )}
                  Sair da fila
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  disabled={actionDisabled}
                  onClick={joinQueue}
                  size="lg"
                >
                  {busyKey === "join-queue" ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <UserPlus aria-hidden="true" className="size-4" />
                  )}
                  Entrar na fila
                </Button>
              )}

              {roundIsActive ? (
                <Button asChild className="w-full sm:w-auto" size="lg">
                  <Link href={`/tables/${table.id}/scoreboard`}>
                    <MonitorUp aria-hidden="true" className="size-4" />
                    Abrir placar
                  </Link>
                </Button>
              ) : null}

              {table.viewerIsPlaying ? (
                <Button
                  asChild
                  className="w-full sm:w-auto"
                  size="lg"
                  variant="secondary"
                >
                  <Link href={`/tables/${table.id}/scoreboard/controls`}>
                    <Plus aria-hidden="true" className="size-4" />
                    Controles
                  </Link>
                </Button>
              ) : null}
            </div>

            {canManage && roundIsActive ? (
              <div className="border-t border-border pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full sm:w-auto"
                      disabled={actionDisabled}
                      size="sm"
                      variant="destructive"
                    >
                      <Trophy aria-hidden="true" className="size-4" />
                      Encerrar rodada
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar vencedor</DialogTitle>
                      <DialogDescription>
                        Escolha quem venceu a rodada. O Elo será recalculado, o
                        resultado será registrado e a fila será reorganizada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {currentMatch.map((participant) => {
                        const playerName = userLabel(participant.user);
                        const actionKey = `finish-match:${participant.id}`;

                        return (
                          <Button
                            aria-label={`Encerrar rodada com vitória de ${playerName}`}
                            className="h-auto justify-start gap-3 p-3"
                            disabled={actionDisabled}
                            key={participant.id}
                            onClick={() =>
                              finishMatch(participant.id, playerName)
                            }
                            variant="outline"
                          >
                            {busyKey === actionKey ? (
                              <Loader2
                                aria-hidden="true"
                                className="size-5 animate-spin"
                              />
                            ) : (
                              <UserAvatar
                                className="size-10"
                                name={playerName}
                                src={participant.user.avatarUrl}
                              />
                            )}
                            <span className="min-w-0 text-left">
                              <span className="block truncate font-medium">
                                {playerName}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {participant.user.playerRanking?.elo ?? 1000}{" "}
                                Elo
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <WorkflowSection
        description="Ordem dos próximos jogadores após a rodada atual."
        icon={<Users aria-hidden="true" className="size-4" />}
        title="Fila de espera"
      >
        {queuedParticipants.length > 0 ? (
          <ol className="grid divide-y divide-border border-y border-border">
            {queuedParticipants.map((participant) => {
              const participantName = userLabel(participant.user);

              return (
                <li
                  className="grid min-w-0 gap-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-3"
                  key={participant.id}
                  value={participant.queuePosition + 1}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:contents">
                    <Badge className="w-fit tabular-nums" variant="outline">
                      #{participant.queuePosition + 1}
                    </Badge>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <UserIdentity user={participant.user} />
                      {participant.user.id === table.viewerUserId ? (
                        <Badge className="shrink-0">Você</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="ml-12 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:ml-0 sm:justify-end">
                    <span>{formatDateTime(participant.joinedAt)}</span>
                    <Badge className="tabular-nums" variant="secondary">
                      {participant.user.playerRanking?.elo ?? 1000} Elo
                    </Badge>
                    {canManage ? (
                      <Button
                        aria-label={`Remover ${participantName} da fila`}
                        disabled={actionDisabled}
                        onClick={() => removeParticipant(participant.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="border-y border-border py-4 text-sm text-muted-foreground">
            Sem jogadores aguardando.
          </p>
        )}
      </WorkflowSection>

      {table.recentMatches.length > 0 ? (
        <WorkflowSection
          description="Resumo compacto das rodadas finalizadas nesta mesa."
          title="Resultados recentes"
        >
          <div className="grid divide-y divide-border border-y border-border md:hidden">
            {table.recentMatches.map((match) => (
              <div className="grid gap-3 py-3" key={match.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge
                    variant={
                      match.kind === "rollback" ? "secondary" : "outline"
                    }
                  >
                    {match.kind === "rollback"
                      ? "Rollback"
                      : match.rolledBack
                        ? "Revertida"
                        : "Rodada"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(match.createdAt)}
                  </span>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Vencedor
                    </p>
                    <UserIdentity user={match.winner} />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Perdedor
                    </p>
                    <UserIdentity user={match.loser} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    {match.winnerOldElo} -&gt; {match.winnerNewElo} /{" "}
                    {match.loserOldElo} -&gt; {match.loserNewElo}
                  </span>
                  {canManage && match.kind === "match" && !match.rolledBack ? (
                    <Button
                      disabled={actionDisabled}
                      onClick={() => rollbackMatch(match.id)}
                      size="sm"
                      variant="destructive"
                    >
                      {busyKey === `rollback-match:${match.id}` ? (
                        <Loader2
                          aria-hidden="true"
                          className="size-4 animate-spin"
                        />
                      ) : (
                        <RotateCcw aria-hidden="true" className="size-4" />
                      )}
                      Reverter
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencedor</TableHead>
                  <TableHead>Perdedor</TableHead>
                  <TableHead>Elo</TableHead>
                  <TableHead>Data</TableHead>
                  {canManage ? (
                    <TableHead className="text-right">Ação</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.recentMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      <Badge
                        variant={
                          match.kind === "rollback" ? "secondary" : "outline"
                        }
                      >
                        {match.kind === "rollback"
                          ? "Rollback"
                          : match.rolledBack
                            ? "Revertida"
                            : "Rodada"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <UserIdentity user={match.winner} />
                    </TableCell>
                    <TableCell>
                      <UserIdentity user={match.loser} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {match.winnerOldElo} -&gt; {match.winnerNewElo} /{" "}
                      {match.loserOldElo} -&gt; {match.loserNewElo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(match.createdAt)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        {match.kind === "match" && !match.rolledBack ? (
                          <Button
                            disabled={actionDisabled}
                            onClick={() => rollbackMatch(match.id)}
                            size="sm"
                            variant="destructive"
                          >
                            {busyKey === `rollback-match:${match.id}` ? (
                              <Loader2
                                aria-hidden="true"
                                className="size-4 animate-spin"
                              />
                            ) : (
                              <RotateCcw
                                aria-hidden="true"
                                className="size-4"
                              />
                            )}
                            Reverter
                          </Button>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </WorkflowSection>
      ) : null}
    </div>
  );
}
