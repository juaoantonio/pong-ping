"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  LogOut,
  Loader2,
  Plus,
  RotateCcw,
  Swords,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import {
  InvitationSettingsControls,
  type InvitationUseMode,
} from "@/components/invitation-settings-controls";
import { type InvitationExpiryPreset } from "@/lib/invitations";
import { formatDateTime, readApiError, userLabel } from "@/lib/client-utils";
import type {
  TableParticipant,
  TableSummary,
  UserIdentityLike,
  UserOption,
} from "@/components/tables/types";

type TableDetailProps = {
  canManage: boolean;
  table: TableSummary;
  users: UserOption[];
};

function buildInvitationLink(token: string) {
  if (typeof window === "undefined") {
    return `/table-invite/${token}`;
  }

  return `${window.location.origin}/table-invite/${token}`;
}

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

function RoundPlayer({
  participant,
  side,
}: {
  participant: TableParticipant;
  side: string;
}) {
  const label = userLabel(participant.user);

  return (
    <div className="flex min-h-72 flex-col items-center justify-between rounded-lg border bg-background p-5 text-center">
      <Badge variant="secondary">{side}</Badge>
      <div className="grid justify-items-center gap-4">
        <UserAvatar
          className="size-28 text-3xl"
          name={label}
          src={participant.user.avatarUrl}
        />
        <div className="grid gap-1">
          <p className="max-w-56 truncate text-2xl font-semibold">{label}</p>
          {participant.user.email ? (
            <p className="max-w-56 truncate text-sm text-muted-foreground">
              {participant.user.email}
            </p>
          ) : null}
        </div>
      </div>
      <Badge className="text-sm">
        {participant.user.playerRanking?.elo ?? 1000} Elo
      </Badge>
    </div>
  );
}

export function TableDetail({ canManage, table, users }: TableDetailProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [inviteExpiresIn, setInviteExpiresIn] =
    useState<InvitationExpiryPreset>("7d");
  const [inviteUseMode, setInviteUseMode] =
    useState<InvitationUseMode>("reusable");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentMatch = table.participants.slice(0, 2);
  const queuedParticipants = table.participants.slice(2);
  const availableUsers = users.filter(
    (user) => !table.members.some((member) => member.user.id === user.id),
  );

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

  function addParticipant() {
    if (!selectedUser) {
      toast.error("Selecione um usuario para adicionar na mesa.");
      return;
    }

    runAction("add-participant", async () => {
      const response = await fetch(
        `/api/admin/tables/${table.id}/participants`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedUser }),
        },
      );

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      setSelectedUser("");
      toast.success("Usuario adicionado a mesa.");
      router.refresh();
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

      toast.success("Voce entrou na fila.");
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

      toast.success("Voce saiu da fila.");
      router.refresh();
    });
  }

  function createInvitation() {
    runAction("create-invite", async () => {
      const response = await fetch(`/api/admin/tables/${table.id}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiresIn: inviteExpiresIn,
          oneTimeUse: inviteUseMode === "one-time",
        }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      const body = (await response.json()) as { invite: { token: string } };
      await navigator.clipboard
        .writeText(buildInvitationLink(body.invite.token))
        .catch(() => undefined);
      toast.success(
        "Link de convite gerado e copiado para a area de transferencia.",
      );
      router.refresh();
    });
  }

  function copyInvitation(token: string) {
    runAction(`copy-invite:${token}`, async () => {
      await navigator.clipboard.writeText(buildInvitationLink(token));
      toast.success("Link de convite copiado.");
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
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,3fr)_minmax(0,7fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Fila
            </CardTitle>
            <CardDescription>
              Vencedor permanece na mesa, perdedor volta para o fim.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {queuedParticipants.length > 0 ? (
              queuedParticipants.map((participant) => (
                <div
                  className="grid gap-3 rounded-lg border p-3"
                  key={participant.id}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">
                      #{participant.queuePosition + 1}
                    </Badge>
                    <Badge variant="secondary">
                      {participant.user.playerRanking?.elo ?? 1000} Elo
                    </Badge>
                  </div>
                  <UserIdentity user={participant.user} />
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatDateTime(participant.joinedAt)}</span>
                    {canManage ? (
                      <Button
                        disabled={isPending}
                        onClick={() => removeParticipant(participant.id)}
                        size="sm"
                        variant="ghost"
                      >
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
                Nenhum jogador aguardando na fila.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="size-4" />
              Rodada atual
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {currentMatch.length === 2 ? (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
                <RoundPlayer participant={currentMatch[0]} side="Jogador 1" />
                <div className="flex items-center justify-center">
                  <Badge className="px-4 py-2 text-base" variant="outline">
                    vs
                  </Badge>
                </div>
                <RoundPlayer participant={currentMatch[1]} side="Jogador 2" />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed px-4 py-16 text-center text-sm text-muted-foreground">
                A mesa precisa de pelo menos dois jogadores na fila para abrir
                uma rodada.
              </div>
            )}
          </CardContent>

          <CardFooter>
            {canManage && currentMatch.length === 2 ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button disabled={isPending} size="lg">
                    <Trophy className="size-4" />
                    Encerrar rodada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar vencedor</DialogTitle>
                    <DialogDescription>
                      Escolha quem venceu a rodada. O Elo sera recalculado e a
                      fila sera reorganizada.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {currentMatch.map((participant) => {
                      const playerName = userLabel(participant.user);
                      const actionKey = `finish-match:${participant.id}`;

                      return (
                        <Button
                          className="h-auto justify-start gap-3 p-3"
                          disabled={isPending}
                          key={participant.id}
                          onClick={() =>
                            finishMatch(participant.id, playerName)
                          }
                          variant="outline"
                        >
                          {busyKey === actionKey ? (
                            <Loader2 className="size-5 animate-spin" />
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
                              {participant.user.playerRanking?.elo ?? 1000} Elo
                            </span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{table.name}</CardTitle>
          <CardDescription>
            Criada por {userLabel(table.createdBy)} em{" "}
            {formatDateTime(table.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Aguardando</p>
            <p className="text-2xl font-semibold">
              {queuedParticipants.length}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Mesa atual</p>
            <p className="text-2xl font-semibold">
              {currentMatch.length === 2 ? "Ativa" : "Aguardando"}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Rodadas recentes</p>
            <p className="text-2xl font-semibold">
              {table.recentMatches.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {table.viewerIsMember ? (
        <Card>
          <CardHeader>
            <CardTitle>Sua participacao</CardTitle>
            <CardDescription>
              Entre na fila quando estiver pronto para jogar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="grid gap-1 text-sm">
              {table.viewerIsPlaying ? (
                <>
                  <p className="font-medium">Sua rodada esta ativa.</p>
                  <p className="text-muted-foreground">
                    Aguarde o encerramento da partida para a fila girar.
                  </p>
                </>
              ) : table.viewerIsQueued ? (
                <>
                  <p className="font-medium">Voce esta na fila.</p>
                  <p className="text-muted-foreground">
                    Posicao #{(table.viewerQueuePosition ?? 0) + 1}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium">Voce esta nesta mesa.</p>
                  <p className="text-muted-foreground">
                    Entre na fila para aguardar sua vez.
                  </p>
                </>
              )}
            </div>
            {!table.viewerIsQueued ? (
              <Button
                disabled={isPending}
                onClick={joinQueue}
                className="sm:self-start"
              >
                {busyKey === "join-queue" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Entrar na fila
              </Button>
            ) : !table.viewerIsPlaying ? (
              <Button
                className="sm:self-start"
                disabled={isPending}
                onClick={leaveQueue}
                variant="outline"
              >
                {busyKey === "leave-queue" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                Sair da fila
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar entrada</CardTitle>
            <CardDescription>
              Adicione membros manualmente ou gere um convite para a mesa.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label>Adicionar membro</Label>
                <Select
                  disabled={isPending || availableUsers.length === 0}
                  onValueChange={setSelectedUser}
                  value={selectedUser}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um jogador" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {userLabel(user)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={isPending || availableUsers.length === 0}
                onClick={addParticipant}
              >
                {busyKey === "add-participant" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Adicionar
              </Button>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(140px,170px)_minmax(140px,170px)_auto] md:items-end">
              <div>
                <p className="text-sm font-medium">Convite por link</p>
                <p className="text-sm text-muted-foreground">
                  Qualquer usuario autenticado com o link entra na mesa.
                </p>
              </div>
              <InvitationSettingsControls
                disabled={isPending}
                expiresIn={inviteExpiresIn}
                expiresInId="table-invite-expires-in"
                onExpiresInChange={setInviteExpiresIn}
                onUseModeChange={setInviteUseMode}
                useMode={inviteUseMode}
                useModeId="table-invite-use-mode"
              />
              <Button
                disabled={isPending}
                onClick={createInvitation}
                variant="outline"
              >
                {busyKey === "create-invite" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Gerar convite
              </Button>
            </div>

            {table.currentInvitation ? (
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-4">
                <p className="break-all text-sm">
                  {buildInvitationLink(table.currentInvitation.token)}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    Expira em{" "}
                    {formatDateTime(table.currentInvitation.expiresAt)}
                  </span>
                  <span>
                    {table.currentInvitation.oneTimeUse
                      ? "Uso unico"
                      : "Reutilizavel"}
                  </span>
                  <Button
                    disabled={isPending}
                    onClick={() =>
                      copyInvitation(table.currentInvitation!.token)
                    }
                    size="sm"
                    variant="ghost"
                  >
                    <Copy className="size-4" />
                    Copiar link
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Ultimas rodadas</CardTitle>
          <CardDescription>
            Historico recente e variacao de Elo da mesa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {table.recentMatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencedor</TableHead>
                  <TableHead>Perdedor</TableHead>
                  <TableHead>Elo</TableHead>
                  <TableHead>Data</TableHead>
                  {canManage ? (
                    <TableHead className="text-right">Acao</TableHead>
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
                            disabled={isPending}
                            onClick={() => rollbackMatch(match.id)}
                            size="sm"
                            variant="ghost"
                          >
                            {busyKey === `rollback-match:${match.id}` ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RotateCcw className="size-4" />
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
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
              Nenhuma rodada finalizada nesta mesa ainda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
