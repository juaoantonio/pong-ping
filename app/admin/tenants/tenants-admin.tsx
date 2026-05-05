"use client";

import { useRouter } from "next/navigation";
import { Building2, Copy, ExternalLink, LogOut, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
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
import { formatDateTime, readApiError } from "@/lib/client-utils";
import { toast } from "sonner";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  userCount: number;
};

type TenantsAdminProps = {
  tenants: TenantRow[];
};

export function TenantsAdmin({ tenants }: TenantsAdminProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isPending, startTransition] = useTransition();

  function createTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const response = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: slug.trim() ? slug : undefined,
        }),
      });

      if (!response.ok) {
        toast.error(await readApiError(response));
        return;
      }

      setName("");
      setSlug("");
      toast.success("Tenant criado.");
      router.refresh();
    });
  }

  function getTenantLoginPath(tenantSlug: string) {
    return `/login?tenant=${encodeURIComponent(tenantSlug)}`;
  }

  function getTenantLoginUrl(tenantSlug: string) {
    return `${window.location.origin}${getTenantLoginPath(tenantSlug)}`;
  }

  async function copyTenantLoginUrl(tenant: TenantRow) {
    try {
      await navigator.clipboard.writeText(getTenantLoginUrl(tenant.slug));
      toast.success("Link de login do tenant copiado.");
    } catch {
      toast.error("Nao foi possivel copiar o link do tenant.");
    }
  }

  function logoutToTenant(tenant: TenantRow) {
    startTransition(async () => {
      await logout(getTenantLoginPath(tenant.slug));
    });
  }

  return (
    <div className="grid gap-6">
      <form
        className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,260px)_auto]"
        onSubmit={createTenant}
      >
        <div className="grid gap-2">
          <Label htmlFor="tenant-name">Nome</Label>
          <Input
            disabled={isPending}
            id="tenant-name"
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="Acme Club"
            required
            value={name}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="tenant-slug">Slug</Label>
          <Input
            disabled={isPending}
            id="tenant-slug"
            maxLength={48}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="gerado automaticamente"
            value={slug}
          />
        </div>
        <Button className="self-end" disabled={isPending} type="submit">
          <Plus className="size-4" />
          Criar
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Usuarios</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell>
                <div className="flex min-w-56 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Building2 className="size-4" />
                  </span>
                  <span className="min-w-0 truncate font-medium">
                    {tenant.name}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {tenant.slug}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tenant.userCount}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(tenant.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button asChild size="icon-sm" title="Abrir login do tenant" variant="ghost">
                    <a href={getTenantLoginPath(tenant.slug)}>
                      <ExternalLink className="size-4" aria-hidden="true" />
                      <span className="sr-only">Abrir login de {tenant.name}</span>
                    </a>
                  </Button>
                  <Button
                    onClick={() => copyTenantLoginUrl(tenant)}
                    size="icon-sm"
                    title="Copiar link do tenant"
                    type="button"
                    variant="outline"
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    <span className="sr-only">Copiar link de {tenant.name}</span>
                  </Button>
                  <Button
                    disabled={isPending}
                    onClick={() => logoutToTenant(tenant)}
                    size="icon-sm"
                    title="Sair e abrir login do tenant"
                    type="button"
                    variant="outline"
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    <span className="sr-only">
                      Sair e abrir login de {tenant.name}
                    </span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {tenants.length === 0 ? (
        <div className="rounded-lg border px-4 py-6 text-sm text-muted-foreground">
          Nenhum tenant criado.
        </div>
      ) : null}
    </div>
  );
}
