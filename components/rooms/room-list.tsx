import Link from "next/link";
import { ArrowRight, Swords, UsersRound } from "lucide-react";
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
import type { RoomListItem, UserIdentityLike } from "@/components/rooms/types";

function userLabel(user: UserIdentityLike) {
  return user.name ?? user.email ?? "Usuario";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RoomList({ rooms }: { rooms: RoomListItem[] }) {
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
                <Swords className="size-4" />
                Mesa atual
              </div>
              {room.currentPlayers.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {room.currentPlayers.map((player, index) => {
                    const label = userLabel(player);

                    return (
                      <div
                        className="flex min-w-0 items-center gap-2"
                        key={`${room.id}-${index}-${label}`}
                      >
                        <UserAvatar
                          className="size-8"
                          name={label}
                          src={player.avatarUrl}
                        />
                        <span className="truncate text-sm">{label}</span>
                      </div>
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
                Ultima rodada: {userLabel(room.latestMatch.winner)} venceu em{" "}
                {formatDateTime(room.latestMatch.createdAt)}
              </div>
            ) : null}

            <Button asChild className="justify-self-start" variant="outline">
              <Link href={`/rooms/${room.id}`}>
                Abrir sala
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
