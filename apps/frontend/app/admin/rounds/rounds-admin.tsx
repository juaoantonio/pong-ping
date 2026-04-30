"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Search, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type RoundAdminFilters = {
  q: string;
  roomId: string;
  player: string;
  createdBy: string;
  kind: string;
  status: string;
  from: string;
  to: string;
};

type UserLabel = {
  name: string | null;
  email: string | null;
};

type RoundAdminItem = {
  id: string;
  roomId: string | null;
  rollbackOfId: string | null;
  rolledBack: boolean;
  kind: "match" | "rollback";
  winnerOldElo: number;
  winnerNewElo: number;
  winnerDiffPoints: number;
  loserOldElo: number;
  loserNewElo: number;
  loserDiffPoints: number;
  createdAt: string;
  roomName: string | null;
  winner: UserLabel;
  loser: UserLabel;
  createdBy: UserLabel;
};

type RoundsAdminProps = {
  filters: RoundAdminFilters;
  rounds: RoundAdminItem[];
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string | { message?: string };
  } | null;
  return typeof body?.error === "string"
    ? body.error
    : (body?.error?.message ?? "Nao foi possivel concluir a acao.");
}

function userLabel(user: UserLabel) {
  return user.name ?? user.email ?? "Usuario";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function diffLabel(value: number) {
  return `${value > 0 ? "+" : ""}${value}`;
}

export function RoundsAdmin({ filters, rounds }: RoundsAdminProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyRoundId, setBusyRoundId] = useState<string | null>(null);

  function rollbackRound(round: RoundAdminItem) {
    setBusyRoundId(round.id);
    startTransition(async () => {
      const response = await fetch(`/api/admin/rounds/${round.id}/rollback`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        setBusyRoundId(null);
        return;
      }

      toast.success("Rollback registrado.");
      setBusyRoundId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <form action="/admin/rounds" className="grid gap-4 rounded-lg border p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,2fr)_repeat(2,minmax(160px,1fr))]">
          <div className="grid gap-2">
            <Label htmlFor="round-q">Busca geral</Label>
            <Input
              defaultValue={filters.q}
              id="round-q"
              name="q"
              placeholder="id, room, jogador, criador"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-room">Room id</Label>
            <Input
              defaultValue={filters.roomId}
              id="round-room"
              name="roomId"
              placeholder="cmok..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-player">Jogador</Label>
            <Input
              defaultValue={filters.player}
              id="round-player"
              name="player"
              placeholder="nome ou email"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          <div className="grid gap-2">
            <Label htmlFor="round-kind">Tipo</Label>
            <Select defaultValue={filters.kind} name="kind">
              <SelectTrigger className="w-full" id="round-kind">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="match">Rodadas</SelectItem>
                <SelectItem value="rollback">Rollbacks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-status">Status</Label>
            <Select defaultValue={filters.status} name="status">
              <SelectTrigger className="w-full" id="round-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="rollback_available">
                  Pode reverter
                </SelectItem>
                <SelectItem value="rolled_back">Ja revertida</SelectItem>
                <SelectItem value="rollback_record">
                  Registro rollback
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-created-by">Criado por</Label>
            <Input
              defaultValue={filters.createdBy}
              id="round-created-by"
              name="createdBy"
              placeholder="nome ou email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-from">De</Label>
            <Input
              defaultValue={filters.from}
              id="round-from"
              name="from"
              type="date"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="round-to">Ate</Label>
            <Input
              defaultValue={filters.to}
              id="round-to"
              name="to"
              type="date"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/rounds">
              <X className="size-4" />
              Limpar
            </Link>
          </Button>
          <Button type="submit">
            <Search className="size-4" />
            Buscar
          </Button>
        </div>
      </form>

      {rounds.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Room id</TableHead>
              <TableHead>Sala</TableHead>
              <TableHead>Vencedor</TableHead>
              <TableHead>Perdedor</TableHead>
              <TableHead>Elo</TableHead>
              <TableHead>Criado por</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Rollback de</TableHead>
              <TableHead className="text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rounds.map((round) => {
              const canRollback =
                round.kind === "match" && !round.rolledBack && round.roomId;
              const disabledReason =
                round.kind === "rollback"
                  ? "Registro rollback"
                  : round.rolledBack
                    ? "Ja revertida"
                    : !round.roomId
                      ? "Sem room id"
                      : null;

              return (
                <TableRow key={round.id}>
                  <TableCell>
                    <Badge
                      variant={
                        round.kind === "rollback" ? "secondary" : "outline"
                      }
                    >
                      {round.kind === "rollback"
                        ? "Rollback"
                        : round.rolledBack
                          ? "Revertida"
                          : "Rodada"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-44 truncate font-mono text-xs text-muted-foreground">
                    {round.roomId ?? "sem-sala"}
                  </TableCell>
                  <TableCell>{round.roomName ?? "Sem sala"}</TableCell>
                  <TableCell>{userLabel(round.winner)}</TableCell>
                  <TableCell>{userLabel(round.loser)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {round.winnerOldElo} -&gt; {round.winnerNewElo} (
                    {diffLabel(round.winnerDiffPoints)}) / {round.loserOldElo}{" "}
                    -&gt; {round.loserNewElo} (
                    {diffLabel(round.loserDiffPoints)})
                  </TableCell>
                  <TableCell>{userLabel(round.createdBy)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(round.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-44 truncate font-mono text-xs text-muted-foreground">
                    {round.rollbackOfId ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {canRollback ? (
                      <Button
                        disabled={isPending}
                        onClick={() => rollbackRound(round)}
                        size="sm"
                        variant="ghost"
                      >
                        {busyRoundId === round.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                        Reverter
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {disabledReason}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-8 text-sm text-muted-foreground">
          Nenhuma rodada encontrada.
        </div>
      )}
    </div>
  );
}
