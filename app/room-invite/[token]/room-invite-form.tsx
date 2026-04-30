"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime, readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

type RoomInviteFormProps = {
  expiresAt: string;
  roomName: string;
  token: string;
};

export function RoomInviteForm({
  expiresAt,
  roomName,
  token,
}: RoomInviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function joinRoom(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/rooms/join/${token}`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(
          await readApiError(response, "Nao foi possivel entrar nesta sala."),
        );
        return;
      }

      const body = (await response.json()) as { roomId: string };

      toast.success(`Voce entrou na sala ${roomName}.`);
      router.push(`/rooms/${body.roomId}`);
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={joinRoom}>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Ao entrar, voce sera incluido na sala e podera entrar na fila quando
        estiver pronto. Convite valido ate {formatDateTime(expiresAt)}.
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Entrar na sala
      </Button>
    </form>
  );
}
