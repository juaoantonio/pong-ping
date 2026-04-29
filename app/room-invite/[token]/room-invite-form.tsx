"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type RoomInviteFormProps = {
  expiresAt: string;
  roomName: string;
  token: string;
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Nao foi possivel entrar nesta sala.";
}

export function RoomInviteForm({ expiresAt, roomName, token }: RoomInviteFormProps) {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function joinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/rooms/join/${token}`, {
        method: "POST",
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setMessage({
        type: "success",
        text: `Voce entrou na sala ${roomName}. Aguarde sua vez na fila.`,
      });
    });
  }

  return (
    <form className="grid gap-4" onSubmit={joinRoom}>
      {message ? (
        message.type === "success" ? (
          <div className="flex items-center gap-2 rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm">
            <CheckCircle2 className="size-4" />
            {message.text}
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )
      ) : null}

      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Ao entrar, seu nome sera adicionado ao fim da fila atual da sala. Convite valido ate{" "}
        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(expiresAt))}.
      </div>

      <Button disabled={isPending || message?.type === "success"} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Entrar na sala
      </Button>
    </form>
  );
}
