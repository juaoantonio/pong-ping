"use client";

import { useRouter } from "next/navigation";
import { Copy, Link2, MailPlus } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InvitationSettingsControls,
  type InvitationUseMode,
} from "@/components/invitation-settings-controls";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  type InvitationExpiryPreset,
} from "@/lib/invitations";
import { formatDateTime, readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

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

export function AccessAdmin({ allowedEmails, invitations }: AccessAdminProps) {
  const router = useRouter();
  const [accessEmail, setAccessEmail] = useState("");
  const [inviteExpiresIn, setInviteExpiresIn] =
    useState<InvitationExpiryPreset>("15m");
  const [inviteUseMode, setInviteUseMode] =
    useState<InvitationUseMode>("one-time");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function authorizeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteUrl(null);

    startTransition(async () => {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      setAccessEmail("");
      toast.success(
        "Email autorizado. Agora esta pessoa pode entrar com Google.",
      );
      router.refresh();
    });
  }

  function createInvite() {
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
        toast.error(await readApiError(response));
        return;
      }

      const body = (await response.json()) as { inviteUrl: string };
      setInviteUrl(body.inviteUrl);
      toast.success(
        `Convite criado. Ele expira em ${getInvitationExpiryLabel(inviteExpiresIn)}.`,
      );
      router.refresh();
    });
  }

  async function copyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Link do convite copiado para a area de transferencia.");
  }

  return (
    <div className="grid gap-6">
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
        <InvitationSettingsControls
          disabled={isPending}
          expiresIn={inviteExpiresIn}
          expiresInId="invite-expires-in"
          onExpiresInChange={setInviteExpiresIn}
          onUseModeChange={setInviteUseMode}
          useMode={inviteUseMode}
          useModeId="invite-use-mode"
        />
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
                  {formatDateTime(allowedEmail.createdAt)}
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
                  {formatDateTime(invitation.expiresAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
