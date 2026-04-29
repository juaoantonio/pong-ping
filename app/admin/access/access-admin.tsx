"use client";

import { useRouter } from "next/navigation";
import { Copy, Link2, MailPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getInvitationExpiryLabel,
  INVITATION_EXPIRY_PRESETS,
  type InvitationExpiryPreset,
} from "@/lib/invitations";

type AccessAdminProps = {
  allowedEmails: {
    id: string;
    email: string;
    createdAt: string;
    createdBy: {
      name: string | null;
      email: string | null;
    } | null;
  }[];
  invitations: {
    id: string;
    expiresAt: string;
    oneTimeUse: boolean;
    usedAt: string | null;
    usedByEmail: string | null;
    createdAt: string;
    status: "Disponivel" | "Usado" | "Expirado" | "Reutilizavel";
  }[];
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Nao foi possivel concluir a acao.";
}

export function AccessAdmin({ allowedEmails, invitations }: AccessAdminProps) {
  const router = useRouter();
  const [accessEmail, setAccessEmail] = useState("");
  const [inviteExpiresIn, setInviteExpiresIn] =
    useState<InvitationExpiryPreset>("15m");
  const [inviteUseMode, setInviteUseMode] = useState("one-time");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function authorizeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      setAccessEmail("");
      setMessage({ type: "success", text: "Email autorizado para login." });
      router.refresh();
    });
  }

  function createInvite() {
    setMessage(null);
    setInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "invite",
          expiresIn: inviteExpiresIn,
          oneTimeUse: inviteUseMode === "one-time",
        }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      const body = (await response.json()) as { inviteUrl: string };
      setInviteUrl(body.inviteUrl);
      setMessage({
        type: "success",
        text: `Convite criado. Ele expira em ${getInvitationExpiryLabel(inviteExpiresIn)}.`,
      });
      router.refresh();
    });
  }

  async function copyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    setMessage({ type: "success", text: "Link do convite copiado." });
  }

  return (
    <div className="grid gap-6">
      {message ? (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      ) : null}

      <form
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={authorizeEmail}
      >
        <div className="grid gap-2">
          <Label htmlFor="access-email">Autorizar email</Label>
          <Input
            disabled={isPending}
            id="access-email"
            onChange={(event) => setAccessEmail(event.target.value)}
            placeholder="email@example.com"
            required
            type="email"
            value={accessEmail}
          />
        </div>
        <Button className="self-end" disabled={isPending} type="submit">
          <MailPlus className="size-4" />
          Autorizar
        </Button>
      </form>

      <div className="grid gap-3 md:grid-cols-[minmax(150px,180px)_minmax(150px,180px)_auto_minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-2">
          <Label htmlFor="invite-expires-in">Validade</Label>
          <Select
            disabled={isPending}
            onValueChange={(value: InvitationExpiryPreset) =>
              setInviteExpiresIn(value)
            }
            value={inviteExpiresIn}
          >
            <SelectTrigger id="invite-expires-in">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVITATION_EXPIRY_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="invite-use-mode">Uso</Label>
          <Select
            disabled={isPending}
            onValueChange={setInviteUseMode}
            value={inviteUseMode}
          >
            <SelectTrigger id="invite-use-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-time">Uso unico</SelectItem>
              <SelectItem value="reusable">Reutilizavel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button disabled={isPending} onClick={createInvite} variant="outline">
          <Link2 className="size-4" />
          Criar convite
        </Button>
        <p className="min-w-0 truncate rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
          {inviteUrl ?? "Configure validade e modo de uso do convite."}
        </p>
        <Button
          disabled={!inviteUrl}
          onClick={copyInviteUrl}
          size="icon"
          title="Copiar convite"
          variant="outline"
        >
          <Copy className="size-4" />
        </Button>
      </div>

      <div className="grid gap-2">
        <div>
          <h2 className="text-base font-semibold">Emails autorizados</h2>
          <p className="text-sm text-muted-foreground">
            Somente estes emails conseguem concluir login com Google.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Autorizado por</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allowedEmails.map((allowedEmail) => (
              <TableRow key={allowedEmail.id}>
                <TableCell className="font-medium">
                  {allowedEmail.email}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {allowedEmail.createdBy?.name ??
                    allowedEmail.createdBy?.email ??
                    "Sistema"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(allowedEmail.createdAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-2">
        <div>
          <h2 className="text-base font-semibold">Convites recentes</h2>
          <p className="text-sm text-muted-foreground">
            O link completo so aparece no momento da criacao.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>Email usado</TableHead>
              <TableHead>Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <Badge
                    variant={
                      invitation.status === "Disponivel"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {invitation.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invitation.oneTimeUse ? "Uso unico" : "Reutilizavel"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invitation.usedByEmail ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(invitation.expiresAt))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
