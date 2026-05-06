"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { SubmitEvent } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime, readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

type TableInviteFormProps = {
  expiresAt: string;
  tableName: string;
  token: string;
};

export function TableInviteForm({
  expiresAt,
  tableName,
  token,
}: TableInviteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function joinTable(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/tables/join/${token}`, {
        method: "POST",
      });

      if (!response.ok) {
        toast.error(
          await readApiError(response, "Nao foi possivel entrar nesta mesa."),
        );
        return;
      }

      const body = (await response.json()) as { tableId: string };

      toast.success(`Voce entrou na mesa ${tableName}.`);
      router.push(`/tables/${body.tableId}`);
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={joinTable}>
      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Ao entrar, voce sera incluido na mesa e podera entrar na fila quando
        estiver pronto. Convite valido ate {formatDateTime(expiresAt)}.
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Entrar na mesa
      </Button>
    </form>
  );
}
