"use client";

import { useRouter } from "next/navigation";
import { Trophy } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MatchUser = {
  id: string;
  name: string | null;
  email: string | null;
};

type RecentMatch = {
  id: string;
  winner: { name: string | null; email: string | null };
  loser: { name: string | null; email: string | null };
  winnerOldElo: number;
  winnerNewElo: number;
  loserOldElo: number;
  loserNewElo: number;
  createdAt: string;
};

type MatchesAdminProps = {
  users: MatchUser[];
  recentMatches: RecentMatch[];
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Nao foi possivel concluir a acao.";
}

function userLabel(user: MatchUser | RecentMatch["winner"]) {
  return user.name ?? user.email ?? "Usuario";
}

export function MatchesAdmin({ users, recentMatches }: MatchesAdminProps) {
  const router = useRouter();
  const [winnerUserId, setWinnerUserId] = useState("");
  const [loserUserId, setLoserUserId] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function finishMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerUserId, loserUserId }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setWinnerUserId("");
      setLoserUserId("");
      setMessage({ type: "success", text: "Partida finalizada. Elo atualizado." });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-5">
      {message ? (
        <div
          className={
            message.type === "success"
              ? "rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm"
              : "rounded-md border border-destructive/30 bg-destructive/15 px-4 py-3 text-sm"
          }
          role="status"
        >
          {message.text}
        </div>
      ) : null}

      <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={finishMatch}>
        <label className="grid gap-2 text-sm font-medium">
          Vencedor
          <Select
            disabled={isPending}
            onChange={(event) => setWinnerUserId(event.target.value)}
            required
            value={winnerUserId}
          >
            <option value="">Selecione</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userLabel(user)}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          Perdedor
          <Select
            disabled={isPending}
            onChange={(event) => setLoserUserId(event.target.value)}
            required
            value={loserUserId}
          >
            <option value="">Selecione</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {userLabel(user)}
              </option>
            ))}
          </Select>
        </label>

        <Button className="self-end" disabled={isPending || users.length < 2} type="submit">
          <Trophy className="size-4" />
          Finalizar
        </Button>
      </form>

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
          {recentMatches.map((match) => (
            <TableRow key={match.id}>
              <TableCell className="font-medium">{userLabel(match.winner)}</TableCell>
              <TableCell>{userLabel(match.loser)}</TableCell>
              <TableCell className="text-muted-foreground">
                {match.winnerOldElo} -&gt; {match.winnerNewElo} / {match.loserOldElo} -&gt; {match.loserNewElo}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                  new Date(match.createdAt),
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
