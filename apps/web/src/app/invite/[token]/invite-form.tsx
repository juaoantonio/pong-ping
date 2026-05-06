"use client";

import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

type InviteFormProps = {
  token: string;
};

export function InviteForm({ token }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        toast.error(
          await readApiError(response, "Nao foi possivel usar este convite."),
        );
        return;
      }

      toast.success("Email autorizado. Agora voce pode entrar com Google.");
      setEmail("");
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          disabled={isPending}
          id="invite-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@empresa.com"
          required
          type="email"
          value={email}
        />
      </div>

      <Button disabled={isPending} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Autorizar meu email
      </Button>
    </form>
  );
}
