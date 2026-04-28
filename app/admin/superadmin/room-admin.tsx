"use client";

import { Copy, Loader2, Plus, Swords, Trophy, UserPlus, Users } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type UserIdentityLike = {
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
};

type RoomParticipant = {
  id: string;
  queuePosition: number;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    playerRanking: {
      elo: number;
      wins: number;
      total_matches: number;
      winRate: number;
    } | null;
  };
};

type RoomMatch = {
  id: string;
  createdAt: string;
  winnerOldElo: number;
  winnerNewElo: number;
  loserOldElo: number;
  loserNewElo: number;
  winner: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  loser: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
};

type RoomSummary = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: {
    name: string | null;
    email: string | null;
  };
  currentInvitation: {
    id: string;
    token: string;
    expiresAt: string;
  } | null;
  participants: RoomParticipant[];
  recentMatches: RoomMatch[];
};

type RoomAdminProps = {
  canManage?: boolean;
  rooms: RoomSummary[];
  users: UserOption[];
};

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Nao foi possivel concluir a acao.";
}

function userLabel(user: UserIdentityLike) {
  return user.name ?? user.email ?? "Usuario";
}

function UserIdentity({
  user,
  emphasis = false,
}: {
  user: UserIdentityLike;
  emphasis?: boolean;
}) {
  const label = userLabel(user);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9" name={label} src={user.avatarUrl ?? null} />
      <div className="min-w-0">
        <p className={emphasis ? "truncate font-semibold" : "truncate font-medium"}>{label}</p>
        {user.email ? <p className="truncate text-xs text-muted-foreground">{user.email}</p> : null}
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

function buildInvitationLink(token: string) {
  if (typeof window === "undefined") {
    return `/room-invite/${token}`;
  }

  return `${window.location.origin}/room-invite/${token}`;
}

export function RoomAdmin({ canManage = true, rooms, users }: RoomAdminProps) {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(actionKey: string, callback: () => Promise<void>) {
    setMessage(null);
    setBusyKey(actionKey);

    startTransition(async () => {
      try {
        await callback();
      } finally {
        setBusyKey(null);
      }
    });
  }

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    runAction("create-room", async () => {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setRoomName("");
      setMessage({ type: "success", text: "Sala criada com sucesso." });
      router.refresh();
    });
  }

  function addParticipant(roomId: string) {
    const userId = selectedUsers[roomId];

    if (!userId) {
      setMessage({ type: "error", text: "Selecione um usuario para adicionar na sala." });
      return;
    }

    runAction(`add-participant:${roomId}`, async () => {
      const response = await fetch(`/api/admin/rooms/${roomId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setSelectedUsers((current) => ({ ...current, [roomId]: "" }));
      setMessage({ type: "success", text: "Jogador adicionado ao fim da fila." });
      router.refresh();
    });
  }

  function createInvitation(roomId: string) {
    runAction(`create-invite:${roomId}`, async () => {
      const response = await fetch(`/api/admin/rooms/${roomId}/invites`, {
        method: "POST",
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      const body = (await response.json()) as {
        invite: {
          token: string;
        };
      };
      const invitationLink = buildInvitationLink(body.invite.token);

      await navigator.clipboard.writeText(invitationLink).catch(() => undefined);
      setMessage({
        type: "success",
        text: "Link de convite gerado e copiado para a area de transferencia.",
      });
      router.refresh();
    });
  }

  function copyInvitation(token: string) {
    runAction(`copy-invite:${token}`, async () => {
      const invitationLink = buildInvitationLink(token);
      await navigator.clipboard.writeText(invitationLink);
      setMessage({ type: "success", text: "Link de convite copiado." });
    });
  }

  function removeParticipant(roomId: string, participantId: string) {
    runAction(`remove-participant:${participantId}`, async () => {
      const response = await fetch(`/api/admin/rooms/${roomId}/participants/${participantId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setMessage({ type: "success", text: "Jogador removido da sala." });
      router.refresh();
    });
  }

  function finishMatch(roomId: string, winnerParticipantId: string, winnerName: string) {
    runAction(`finish-match:${roomId}:${winnerParticipantId}`, async () => {
      const response = await fetch(`/api/admin/rooms/${roomId}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerParticipantId }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setMessage({
        type: "success",
        text: `Rodada encerrada. ${winnerName} venceu e o Elo foi recalculado.`,
      });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {message ? (
        message.type === "error" ? (
          <Alert>{message.text}</Alert>
        ) : (
          <div className="rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm">{message.text}</div>
        )
      ) : null}

      {canManage ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Nova sala</CardTitle>
            <CardDescription>
              O criador pode montar a fila manualmente ou compartilhar um convite para autoentrada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={createRoom}>
              <label className="grid gap-2 text-sm font-medium" htmlFor="room-name">
                Nome da sala
                <Input
                  disabled={isPending}
                  id="room-name"
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="Mesa principal"
                  required
                  value={roomName}
                />
              </label>
              <Button disabled={isPending || !roomName.trim()} type="submit">
                {busyKey === "create-room" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Criar sala
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {rooms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Nenhuma sala criada ainda.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {rooms.map((room) => {
            const currentMatch = room.participants.slice(0, 2);
            const availableUsers = users.filter(
              (user) => !room.participants.some((participant) => participant.user.id === user.id),
            );
            const invitationLink = room.currentInvitation
              ? buildInvitationLink(room.currentInvitation.token)
              : null;
            const creatorName = userLabel(room.createdBy);

            return (
              <Card key={room.id} className="h-full">
                <CardHeader className="gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>{room.name}</CardTitle>
                      <CardDescription>
                        Criada por {creatorName} em {formatDateTime(room.createdAt)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{room.participants.length} na fila</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-5">
                  {canManage ? (
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Users className="size-4" />
                        Entrada de jogadores
                      </div>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <label className="grid gap-2 text-sm font-medium">
                          Adicionar manualmente
                          <Select
                            disabled={isPending || availableUsers.length === 0}
                            onChange={(event) =>
                              setSelectedUsers((current) => ({ ...current, [room.id]: event.target.value }))
                            }
                            value={selectedUsers[room.id] ?? ""}
                          >
                            <option value="">Selecione um jogador</option>
                            {availableUsers.map((user) => (
                              <option key={user.id} value={user.id}>
                                {userLabel(user)}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <Button
                          className="self-end"
                          disabled={isPending || availableUsers.length === 0}
                          onClick={() => addParticipant(room.id)}
                          type="button"
                          variant="outline"
                        >
                          {busyKey === `add-participant:${room.id}` ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <UserPlus className="size-4" />
                          )}
                          Adicionar
                        </Button>
                      </div>

                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="grid gap-1">
                            <p className="text-sm font-medium">Convite por link</p>
                            <p className="text-xs text-muted-foreground">
                              O link permite que qualquer usuario autenticado entre no fim da fila.
                            </p>
                          </div>
                          <Button
                            disabled={isPending}
                            onClick={() => createInvitation(room.id)}
                            type="button"
                            variant="outline"
                          >
                            {busyKey === `create-invite:${room.id}` ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Plus className="size-4" />
                            )}
                            Gerar convite
                          </Button>
                        </div>

                        {invitationLink ? (
                          <div className="mt-3 grid gap-2">
                            <div className="rounded-md border border-border bg-background px-3 py-2 text-sm break-all">
                              {invitationLink}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                              <span>Expira em {formatDateTime(room.currentInvitation!.expiresAt)}</span>
                              <Button
                                disabled={isPending}
                                onClick={() => copyInvitation(room.currentInvitation!.token)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                {busyKey === `copy-invite:${room.currentInvitation!.token}` ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Copy className="size-4" />
                                )}
                                Copiar link
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Swords className="size-4" />
                      Mesa atual
                    </div>
                    {currentMatch.length === 2 ? (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          {currentMatch.map((participant, index) => {
                            const playerName = userLabel(participant.user);
                            return (
                              <div key={participant.id} className="rounded-md border border-border bg-background p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm text-muted-foreground">
                                      {index === 0 ? "Lado A" : "Lado B"}
                                    </p>
                                    <UserIdentity emphasis user={participant.user} />
                                  </div>
                                  <Badge>{participant.user.playerRanking?.elo ?? 1000} Elo</Badge>
                                </div>
                                {canManage ? (
                                  <Button
                                    className="mt-4 w-full"
                                    disabled={isPending}
                                    onClick={() => finishMatch(room.id, participant.id, playerName)}
                                    type="button"
                                  >
                                    {busyKey === `finish-match:${room.id}:${participant.id}` ? (
                                      <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                      <Trophy className="size-4" />
                                    )}
                                    Marcar {playerName} como vencedor
                                  </Button>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                        A sala precisa de pelo menos dois jogadores na fila para abrir uma rodada.
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium">Fila da sala</div>
                      <Badge variant="secondary">
                        Regra atual: vencedor permanece na mesa, perdedor vai para o fim da fila
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posicao</TableHead>
                          <TableHead>Jogador</TableHead>
                          <TableHead>Elo</TableHead>
                          <TableHead>Entrada</TableHead>
                          {canManage ? <TableHead className="text-right">Acao</TableHead> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {room.participants.map((participant) => (
                          <TableRow key={participant.id}>
                            <TableCell className="font-medium">#{participant.queuePosition + 1}</TableCell>
                            <TableCell>
                              <UserIdentity user={participant.user} />
                            </TableCell>
                            <TableCell>{participant.user.playerRanking?.elo ?? 1000}</TableCell>
                            <TableCell className="text-muted-foreground">{formatDateTime(participant.joinedAt)}</TableCell>
                            {canManage ? (
                              <TableCell className="text-right">
                                <Button
                                  disabled={isPending}
                                  onClick={() => removeParticipant(room.id, participant.id)}
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                >
                                  {busyKey === `remove-participant:${participant.id}` ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : null}
                                  Remover
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="grid gap-3">
                    <div className="text-sm font-medium">Ultimas rodadas</div>
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
                              <TableCell className="font-medium">
                                <UserIdentity user={match.winner} />
                              </TableCell>
                              <TableCell>
                                <UserIdentity user={match.loser} />
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {match.winnerOldElo} -&gt; {match.winnerNewElo} / {match.loserOldElo} -&gt;{" "}
                                {match.loserNewElo}
                              </TableCell>
                              <TableCell className="text-muted-foreground">{formatDateTime(match.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                        Nenhuma rodada finalizada nesta sala ainda.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
