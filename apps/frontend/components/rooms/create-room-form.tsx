"use client";

import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string | { message?: string };
  } | null;
  return typeof body?.error === "string"
    ? body.error
    : (body?.error?.message ?? "Nao foi possivel criar a sala.");
}

export function CreateRoomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: roomName }),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        return;
      }

      setRoomName("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nova sala
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sala</DialogTitle>
          <DialogDescription>
            Crie uma sala para organizar fila, mesa atual e historico de
            rodadas.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={createRoom}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="room-name">Nome da sala</Label>
            <Input
              disabled={isPending}
              id="room-name"
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Mesa principal"
              required
              value={roomName}
            />
          </div>
          <Button disabled={isPending || !roomName.trim()} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar sala
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
