"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { UserAvatar } from "@/components/user-avatar";
import { canDeleteUser, type Role } from "@/lib/auth/roles";
import { formatDate, readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

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

export function UsersAdmin({ currentUser, users }: UsersAdminProps) {
  const router = useRouter();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canChangeRoles = currentUser.role === "superadmin";

  function changeRole(user: AdminUser, role: Role) {
    if (user.role === role) {
      return;
    }

    setPendingUserId(user.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        setPendingUserId(null);
        return;
      }

      toast.success("Role atualizada.");
      setPendingUserId(null);
      router.refresh();
    });
  }

  function deleteUser(user: AdminUser) {
    setPendingUserId(user.id);

    startTransition(async () => {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        setPendingUserId(null);
        return;
      }

      toast.success("Usuário removido.");
      setPendingUserId(null);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
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
          {users.map((user) => {
            const busy = (isPending && pendingUserId === user.id) || false;
            const isSelf = user.id === currentUser.id;
            const canDelete =
              !isSelf && canDeleteUser(currentUser.role, user.role);
            const canChangeRole = canChangeRoles && !isSelf;
            const label = user.name ?? user.email ?? "Usuário";

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex min-w-64 items-center gap-3">
                    <UserAvatar name={label} src={user.avatarUrl} />
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
                  {formatDate(user.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Select
                      disabled={!canChangeRole || busy}
                      onValueChange={(role) => changeRole(user, role as Role)}
                      value={user.role}
                    >
                      <SelectTrigger aria-label="Alterar role" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Superadmin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          aria-label="Remover usuario"
                          disabled={!canDelete || busy}
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
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remover usuario</DialogTitle>
                          <DialogDescription>
                            Esta acao remove{" "}
                            {user.email ?? user.name ?? "este usuario"}.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            disabled={busy}
                            onClick={() => deleteUser(user)}
                            variant="destructive"
                          >
                            Remover
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {users.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border px-4 py-6 text-sm text-muted-foreground">
          <ShieldCheck className="size-4" />
          Nenhum usuario disponivel para o seu nivel de acesso.
        </div>
      ) : null}
    </div>
  );
}
