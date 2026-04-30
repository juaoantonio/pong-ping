"use client";

import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type ProfileFormProps = {
  initialName: string;
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string | { message?: string };
  } | null;
  return typeof body?.error === "string"
    ? body.error
    : (body?.error?.message ?? "Nao foi possivel atualizar o perfil.");
}

export function ProfileForm({ initialName }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const normalizedName = name.trim();
  const hasChanges = normalizedName !== initialName;

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      setName(normalizedName);
      toast.success("Perfil atualizado.");
      router.refresh();
    });
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="profile-name">Nome</Label>
        <Input
          disabled={isPending}
          id="profile-name"
          maxLength={80}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          placeholder="Seu nome"
          required
          value={name}
        />
      </div>

      <Button
        className="justify-self-start"
        disabled={isPending || !hasChanges || normalizedName.length < 2}
        type="submit"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        Salvar alteracoes
      </Button>
    </form>
  );
}
