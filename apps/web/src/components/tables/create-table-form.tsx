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
import { readApiError } from "@/lib/client-utils";

export function CreateTableForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tableName }),
      });

      if (!response.ok) {
        setError(
          await readApiError(response, "Nao foi possivel criar a mesa."),
        );
        return;
      }

      setTableName("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nova mesa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova mesa</DialogTitle>
          <DialogDescription>
            Crie uma mesa para organizar fila, mesa atual e historico de
            rodadas.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={createTable}>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="table-name">Nome da mesa</Label>
            <Input
              disabled={isPending}
              id="table-name"
              onChange={(event) => setTableName(event.target.value)}
              placeholder="Mesa principal"
              required
              value={tableName}
            />
          </div>
          <Button disabled={isPending || !tableName.trim()} type="submit">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Criar mesa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
