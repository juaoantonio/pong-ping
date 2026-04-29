"use client";

import { useRouter } from "next/navigation";
import {
  Copy,
  Loader2,
  Plus,
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
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import type {
  RoomSummary,
  UserIdentityLike,
  UserOption,
} from "@/components/rooms/types";

type RoomDetailProps = {
  canManage: boolean;
  room: RoomSummary;
  users: UserOption[];
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Nao foi possivel concluir a acao.";
}

function userLabel(user: UserIdentityLike) {
  return user.name ?? user.email ?? "Usuario";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function buildInvitationLink(token: string) {
  if (typeof window === "undefined") {
    return `/room-invite/${token}`;
  }

  return `${window.location.origin}/room-invite/${token}`;
}

function UserIdentity({ user }: { user: UserIdentityLike }) {
  const label = userLabel(user);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar className="size-9" name={label} src={user.avatarUrl} />
      <div className="min-w-0">
        <p className="truncate font-medium">{label}</p>
        {user.email ? (
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RoomDetail({ canManage, room, users }: RoomDetailProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentMatch = room.participants.slice(0, 2);
  const availableUsers = users.filter(
    (user) =>
      !room.participants.some((participant) => participant.user.id === user.id),
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
      toast.error("Selecione um usuario para adicionar na sala.");
      return;
    }

    runAction("add-participant", async () => {
      const response = await fetch(`/api/admin/rooms/${room.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      setSelectedUser("");
      toast.success("Jogador adicionado ao fim da fila.");
      router.refresh();
    });
  }

  function createInvitation() {
    runAction("create-invite", async () => {
      const response = await fetch(`/api/admin/rooms/${room.id}/invites`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      const body = (await response.json()) as { invite: { token: string } };
      await navigator.clipboard
        .writeText(buildInvitationLink(body.invite.token))
        .catch(() => undefined);
      toast.success("Link de convite gerado e copiado para a area de transferencia.");
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
        `/api/admin/rooms/${room.id}/participants/${participantId}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success("Jogador removido da sala.");
      router.refresh();
    });
  }

  function finishMatch(winnerParticipantId: string, winnerName: string) {
    runAction(`finish-match:${winnerParticipantId}`, async () => {
      const response = await fetch(`/api/admin/rooms/${room.id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerParticipantId }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      toast.success(`Rodada encerrada. ${winnerName} venceu e o Elo foi recalculado.`);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{room.name}</CardTitle>
          <CardDescription>
            Criada por {userLabel(room.createdBy)} em{" "}
            {formatDateTime(room.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Fila</p>
            <p className="text-2xl font-semibold">{room.participants.length}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Mesa atual</p>
            <p className="text-2xl font-semibold">
              {currentMatch.length === 2 ? "Ativa" : "Aguardando"}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Rodadas recentes</p>
            <p className="text-2xl font-semibold">{room.recentMatches.length}</p>
          </div>
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar entrada</CardTitle>
            <CardDescription>
              Adicione jogadores manualmente ou gere um convite para a sala.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="grid gap-2">
                <Label>Adicionar manualmente</Label>
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

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className="text-sm font-medium">Convite por link</p>
                <p className="text-sm text-muted-foreground">
                  Qualquer usuario autenticado com o link entra no fim da fila.
                </p>
              </div>
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

            {room.currentInvitation ? (
              <div className="grid gap-2 rounded-lg border bg-muted/20 p-4">
                <p className="break-all text-sm">
                  {buildInvitationLink(room.currentInvitation.token)}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    Expira em {formatDateTime(room.currentInvitation.expiresAt)}
                  </span>
                  <Button
                    disabled={isPending}
                    onClick={() => copyInvitation(room.currentInvitation!.token)}
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

      <Tabs defaultValue="mesa">
        <TabsList>
          <TabsTrigger value="mesa">Mesa</TabsTrigger>
          <TabsTrigger value="fila">Fila</TabsTrigger>
          <TabsTrigger value="historico">Historico</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="mesa">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="size-4" />
                Mesa atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentMatch.length === 2 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {currentMatch.map((participant, index) => {
                    const playerName = userLabel(participant.user);

                    return (
                      <div className="rounded-lg border p-4" key={participant.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="mb-2 text-sm text-muted-foreground">
                              {index === 0 ? "Lado A" : "Lado B"}
                            </p>
                            <UserIdentity user={participant.user} />
                          </div>
                          <Badge>
                            {participant.user.playerRanking?.elo ?? 1000} Elo
                          </Badge>
                        </div>
                        {canManage ? (
                          <Button
                            className="mt-4 w-full"
                            disabled={isPending}
                            onClick={() =>
                              finishMatch(participant.id, playerName)
                            }
                          >
                            {busyKey === `finish-match:${participant.id}` ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trophy className="size-4" />
                            )}
                            Marcar vencedor
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
                  A sala precisa de pelo menos dois jogadores na fila para abrir
                  uma rodada.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-4" value="fila">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Fila da sala
              </CardTitle>
              <CardDescription>
                Vencedor permanece na mesa, perdedor vai para o fim da fila.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posicao</TableHead>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Elo</TableHead>
                    <TableHead>Entrada</TableHead>
                    {canManage ? (
                      <TableHead className="text-right">Acao</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {room.participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        #{participant.queuePosition + 1}
                      </TableCell>
                      <TableCell>
                        <UserIdentity user={participant.user} />
                      </TableCell>
                      <TableCell>
                        {participant.user.playerRanking?.elo ?? 1000}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(participant.joinedAt)}
                      </TableCell>
                      {canManage ? (
                        <TableCell className="text-right">
                          <Button
                            disabled={isPending}
                            onClick={() => removeParticipant(participant.id)}
                            size="sm"
                            variant="ghost"
                          >
                            Remover
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="mt-4" value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Ultimas rodadas</CardTitle>
            </CardHeader>
            <CardContent>
              {room.recentMatches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencedor</TableHead>
                      <TableHead>Perdedor</TableHead>
                      <TableHead>Elo</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {room.recentMatches.map((match) => (
                      <TableRow key={match.id}>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
                  Nenhuma rodada finalizada nesta sala ainda.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
