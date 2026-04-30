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
import type { RoomListItem } from "@/components/rooms/types";
import { Fragment, startTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDateTime, readApiError, userLabel } from "@/lib/client-utils";

export function RoomList({ rooms }: { rooms: RoomListItem[] }) {
  const router = useRouter();

  function deleteRoom(roomId: string) {
    const userConfirmed = window.confirm(
      "Tem certeza que deseja remover esta sala?",
    );
    if (!userConfirmed) {
      return;
    }
    startTransition(async () => {
      const response = await fetch(`/api/admin/rooms/${roomId}`, {
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

  if (rooms.length === 0) {
    return (
      <div className="rounded-lg border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhuma sala criada ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {rooms.map((room) => (
        <Card key={room.id}>
          <CardHeader>
            <CardTitle>{room.name}</CardTitle>
            <CardDescription>
              Criada por {userLabel(room.createdBy)} em{" "}
              {formatDateTime(room.createdAt)}
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{room.participantCount} na fila</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                Rodada atual
              </div>
              {room.currentPlayers.length > 0 ? (
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  {room.currentPlayers.map((player, index) => {
                    const label = userLabel(player);

                    return (
                      <Fragment key={`${room.id}-${index}-${label}`}>
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

            {room.latestMatch ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UsersRound className="size-4" />
                {room.latestMatch.kind === "rollback" ? (
                  <>
                    Ultimo rollback: {userLabel(room.latestMatch.winner)} x{" "}
                    {userLabel(room.latestMatch.loser)} em{" "}
                    {formatDateTime(room.latestMatch.createdAt)}
                  </>
                ) : (
                  <>
                    Ultima rodada: {userLabel(room.latestMatch.winner)} venceu
                    em {formatDateTime(room.latestMatch.createdAt)}
                  </>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <Button asChild className="justify-self-start" variant="outline">
                <Link href={`/rooms/${room.id}`}>
                  Abrir sala
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                className="justify-self-start"
                onClick={() => deleteRoom(room.id)}
              >
                <Trash className="size-4" />
                Remover sala
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
