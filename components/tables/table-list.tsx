"use client";

import Link from "next/link";
import { ArrowRight, Swords, Trash, UsersRound } from "lucide-react";
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

export function TableList({ tables }: { tables: TableListItem[] }) {
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
      <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhuma mesa criada ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tables.map((table) => (
        <Card key={table.id}>
          <CardHeader>
            <CardTitle>{table.name}</CardTitle>
            <CardDescription>
              Criada por {userLabel(table.createdBy)} em{" "}
              {formatDateTime(table.createdAt)}
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{table.participantCount} na fila</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                Rodada atual
              </div>
              {table.currentPlayers.length > 0 ? (
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  {table.currentPlayers.map((player, index) => {
                    const label = userLabel(player);

                    return (
                      <Fragment key={`${table.id}-${index}-${label}`}>
                        <div className="flex min-w-0 items-center gap-2">
                          <UserAvatar
                            className="size-8"
                            name={label}
                            src={player.avatarUrl}
                          />
                          <span className="truncate text-sm si">{label}</span>
                        </div>{" "}
                        {index === 0 && (
                          <Swords className={"size-8 text-gray-600"} />
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersRound className="size-4" />
                {table.latestMatch.kind === "rollback" ? (
                  <>
                    Ultimo rollback: {userLabel(table.latestMatch.winner)} x{" "}
                    {userLabel(table.latestMatch.loser)} em{" "}
                    {formatDateTime(table.latestMatch.createdAt)}
                  </>
                ) : (
                  <>
                    Ultima rodada: {userLabel(table.latestMatch.winner)} venceu
                    em {formatDateTime(table.latestMatch.createdAt)}
                  </>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button asChild className="justify-self-start" variant="outline">
                <Link href={`/tables/${table.id}`}>
                  Abrir mesa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                className="justify-self-start"
                onClick={() => deleteTable(table.id)}
              >
                <Trash className="size-4" />
                Remover mesa
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
