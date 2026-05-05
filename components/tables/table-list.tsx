"use client";

import Link from "next/link";
import { ArrowRight, Swords, Trash, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="overflow-hidden rounded-2xl border border-border/60">
      <div className="divide-y divide-border/60">
        {tables.map((table) => (
          <article
            className="grid gap-5 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] lg:gap-6"
            key={table.id}
          >
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="truncate text-lg font-semibold sm:text-xl">
                    {table.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Criada por {userLabel(table.createdBy)} em{" "}
                    {formatDateTime(table.createdAt)}
                  </p>
                </div>
                <Badge
                  className="shrink-0"
                  variant={
                    table.currentPlayers.length >= 2 ? "default" : "outline"
                  }
                >
                  {table.participantCount} na fila
                </Badge>
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
            </div>

            <div className="min-w-0 space-y-2 rounded-xl bg-secondary/50 px-3 py-3 sm:px-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Rodada atual
              </div>
              {table.currentPlayers.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  {table.currentPlayers.map((player, index) => {
                    const label = userLabel(player);

                    return (
                      <Fragment key={`${table.id}-${index}-${label}`}>
                        <div className="flex min-w-0 items-center gap-2">
                          <UserAvatar
                            className="size-9"
                            name={label}
                            src={player.avatarUrl}
                          />
                          <span className="min-w-0 truncate text-sm font-medium">
                            {label}
                          </span>
                        </div>
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

            <div className="flex flex-wrap items-center gap-2 lg:min-w-44 lg:flex-col lg:items-stretch">
              <Button asChild className="justify-self-start lg:w-full">
                <Link href={`/tables/${table.id}`}>
                  Abrir mesa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              {canRemoveTables ? (
                <Button
                  className="justify-self-start lg:w-full"
                  onClick={() => deleteTable(table.id)}
                  variant="destructive"
                >
                  <Trash className="size-4" />
                  Remover mesa
                </Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
