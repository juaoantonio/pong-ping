"use client";

import { useRouter } from "next/navigation";
import { Copy, Link2, MailPlus, ShieldCheck, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canDeleteUser, type Role } from "@/lib/auth/roles";

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: Role;
  createdAt: string;
};

type UsersAdminProps = {
  currentUser: {
    id: string;
    role: Role;
  };
  users: AdminUser[];
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
    usedAt: string | null;
    usedByEmail: string | null;
    createdAt: string;
    status: "Disponivel" | "Usado";
  }[];
};

const roleLabels: Record<Role, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  user: "User",
};

const roleBadgeVariant: Record<Role, "default" | "secondary" | "outline"> = {
  superadmin: "default",
  admin: "secondary",
  user: "outline",
};

async function readApiError(response: Response) {
  const body = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return body?.error ?? "Nao foi possivel concluir a acao.";
}

export function UsersAdmin({
  currentUser,
  users,
  allowedEmails,
  invitations,
}: UsersAdminProps) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [accessEmail, setAccessEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canChangeRoles = currentUser.role === "superadmin";

  const visibleUsers = useMemo(() => users, [users]);

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
        body: JSON.stringify({ type: "invite" }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        return;
      }

      const body = (await response.json()) as { inviteUrl: string };
      setInviteUrl(body.inviteUrl);
      setMessage({
        type: "success",
        text: "Convite criado. Ele expira em 15 minutos.",
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

  function changeRole(user: AdminUser, role: Role) {
    if (user.role === role) {
      return;
    }

    setMessage(null);
    setPendingUserId(user.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        setPendingUserId(null);
        return;
      }

      setMessage({ type: "success", text: "Role atualizada." });
      setPendingUserId(null);
      router.refresh();
    });
  }

  function deleteUser(user: AdminUser) {
    if (
      !window.confirm(`Remover ${user.email ?? user.name ?? "este usuario"}?`)
    ) {
      return;
    }

    setMessage(null);
    setPendingUserId(user.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setMessage({ type: "error", text: await readApiError(response) });
        setPendingUserId(null);
        return;
      }

      setMessage({ type: "success", text: "Usuario removido." });
      setPendingUserId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <div
          className={
            message.type === "success"
              ? "rounded-md border border-chart-3/30 bg-chart-3/10 px-4 py-3 text-sm text-foreground"
              : "rounded-md border border-destructive/30 bg-destructive/15 px-4 py-3 text-sm text-destructive-foreground"
          }
          role="status"
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-3 border-b border-border pb-4">
        <form
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={authorizeEmail}
        >
          <label
            className="grid gap-2 text-sm font-medium"
            htmlFor="access-email"
          >
            Autorizar email
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isPending}
              id="access-email"
              onChange={(event) => setAccessEmail(event.target.value)}
              placeholder="email@example.com"
              required
              type="email"
              value={accessEmail}
            />
          </label>
          <Button className="self-end" disabled={isPending} type="submit">
            <MailPlus className="size-4" />
            Autorizar
          </Button>
        </form>

        <div className="grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <Button disabled={isPending} onClick={createInvite} variant="outline">
            <Link2 className="size-4" />
            Criar convite
          </Button>
          <p className="min-w-0 truncate rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            {inviteUrl ?? "Convites expiram em 15 minutos e sao de uso unico."}
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
              <TableHead>Email usado</TableHead>
              <TableHead>Expira em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              return (
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
                    {invitation.usedByEmail ?? "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(invitation.expiresAt))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-[220px] text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleUsers.map((user) => {
            const busy = (isPending && pendingUserId === user.id) || false;
            const isSelf = user.id === currentUser.id;
            const canDelete =
              !isSelf && canDeleteUser(currentUser.role, user.role);
            const canChangeRole = canChangeRoles && !isSelf;

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex min-w-64 items-center gap-3">
                    <Avatar
                      name={user.name ?? user.email ?? "Usuario"}
                      src={user.avatarUrl}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {user.name ?? "Sem nome"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email ?? "Sem email"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleBadgeVariant[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                  }).format(new Date(user.createdAt))}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Select
                      aria-label="Alterar role"
                      disabled={!canChangeRole || busy}
                      onChange={(event) =>
                        changeRole(user, event.target.value as Role)
                      }
                      value={user.role}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </Select>
                    <Button
                      aria-label="Remover usuario"
                      disabled={!canDelete || busy}
                      onClick={() => deleteUser(user)}
                      size="icon"
                      title={
                        !canDelete
                          ? "Acao indisponivel para esta role"
                          : "Remover usuario"
                      }
                      variant="outline"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {visibleUsers.length === 0 ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-4 py-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" />
          Nenhum usuario disponivel para o seu nivel de acesso.
        </div>
      ) : null}
    </div>
  );
}
