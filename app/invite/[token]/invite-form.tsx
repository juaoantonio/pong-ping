"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type InviteFormProps = {
  token: string;
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? "Nao foi possivel usar este convite.";
}

export function InviteForm({ token }: InviteFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const response = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setMessage({ type: "success", text: "Email autorizado. Agora voce pode entrar com Google." });
      setEmail("");
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {message ? (
        message.type === "success" ? (
          <div className="flex items-center gap-2 rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm">
            <CheckCircle2 className="size-4" />
            {message.text}
          </div>
        ) : (
          <Alert>{message.text}</Alert>
        )
      ) : null}

      <label className="grid gap-2 text-sm font-medium" htmlFor="invite-email">
        Email
        <input
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          disabled={isPending || message?.type === "success"}
          id="invite-email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@empresa.com"
          required
          type="email"
          value={email}
        />
      </label>

      <Button disabled={isPending || message?.type === "success"} type="submit">
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Autorizar meu email
      </Button>
    </form>
  );
}
