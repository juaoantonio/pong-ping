"use client";

import Link from "next/link";
import { ArrowRight, Swords, Trash, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import type { TableListItem } from "@/components/tables/types";
import { Fragment, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDateTime, readApiError, userLabel } from "@/lib/client-utils";

type TableListProps = {
  canRemoveTables: boolean;
  tables: TableListItem[];
};

export function TableList({ canRemoveTables, tables }: TableListProps) {
  const router = useRouter();

  function deleteTable(tableId: string) {
    const userConfirmed = window.confirm(
      "Tem certeza que deseja remover esta mesa?",
    );
    if (!userConfirmed) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/admin/tables/${tableId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        toast.error(
          await readApiError(
            response,
            "Nao foi possivel processar a requisicao.",
          ),
        );
        return;
      }

      router.refresh();
    });
  }

  if (tables.length === 0) {
    return (
      <EmptyState title="Nenhuma mesa criada">
        Crie uma mesa para começar a organizar fila, rodada atual e histórico de
        partidas.
      </EmptyState>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tables.map((table) => (
        <Card className="overflow-hidden" key={table.id}>
          <CardHeader>
            <CardTitle className="truncate text-xl">{table.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              Criada por {userLabel(table.createdBy)} em{" "}
              {formatDateTime(table.createdAt)}
            </CardDescription>
            <CardAction>
              <Badge
                variant={
                  table.currentPlayers.length >= 2 ? "default" : "outline"
                }
              >
                {table.participantCount} na fila
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-lg bg-secondary/60 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                Rodada atual
              </div>
              {table.currentPlayers.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  {table.currentPlayers.map((player, index) => {
                    const label = userLabel(player);

                    return (
                      <Fragment key={`${table.id}-${index}-${label}`}>
                        <div className="flex min-w-0 items-center gap-2 rounded-md bg-background/70 p-2">
                          <UserAvatar
                            className="size-9"
                            name={label}
                            src={player.avatarUrl}
                          />
                          <span className="min-w-0 truncate text-sm font-medium">
                            {label}
                          </span>
                        </div>{" "}
                        {index === 0 && (
                          <Swords
                            aria-hidden="true"
                            className="mx-auto hidden size-5 text-muted-foreground sm:block"
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aguardando jogadores na fila.
                </p>
              )}
            </div>

            {table.latestMatch ? (
              <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                <UsersRound
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <span className="min-w-0 break-words">
                  {table.latestMatch.kind === "rollback" ? (
                    <>
                      Último rollback: {userLabel(table.latestMatch.winner)} x{" "}
                      {userLabel(table.latestMatch.loser)} em{" "}
                      {formatDateTime(table.latestMatch.createdAt)}
                    </>
                  ) : (
                    <>
                      Última rodada: {userLabel(table.latestMatch.winner)}{" "}
                      venceu em {formatDateTime(table.latestMatch.createdAt)}
                    </>
                  )}
                </span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="justify-self-start">
                <Link href={`/tables/${table.id}`}>
                  Abrir mesa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {canRemoveTables ? (
                <Button
                  className="justify-self-start"
                  onClick={() => deleteTable(table.id)}
                  variant="destructive"
                >
                  <Trash className="size-4" />
                  Remover mesa
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
