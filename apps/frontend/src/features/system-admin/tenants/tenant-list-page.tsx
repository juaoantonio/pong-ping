import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { Building2, Pencil, Plus, RefreshCw, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type {
  CreateSystemTenantRequestContract,
  SystemTenantResponseContract,
  UpdateSystemTenantRequestContract,
} from "@pong-ping/contracts";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
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
import { ApiClientError } from "@/lib/api/errors";
import {
  createSystemTenant,
  systemTenantsQueryOptions,
  tenantKeys,
  updateSystemTenant,
} from "@/lib/api/system-admin";
import { formatDateTime } from "@/lib/format";
import { tenantOwnerRoles, type TenantOwnerRole } from "@/features/system-admin/roles";

const createTenantSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(160),
  slug: z.string().trim().min(1, "Informe o slug.").max(63),
  ownerEmail: z.email("Informe um email valido."),
  ownerRole: z.enum(["owner", "admin"]).optional(),
});

function errorMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "Nao foi possivel concluir a acao.";
}

export function TenantListPage() {
  const tenants = useQuery(systemTenantsQueryOptions());
  const tenantData = tenants.data ?? [];

  return (
    <PageShell
      action={<CreateTenantDialog />}
      description="Crie tenants, acompanhe status e acesse a administracao de membros de cada organizacao."
      eyebrow="Painel administrativo"
      title="Tenants"
    >
      {tenants.isSuccess ? <TenantOverview tenants={tenantData} /> : null}
      {tenants.isLoading ? <TenantTableSkeleton /> : null}
      {tenants.isError ? (
        <EmptyState
          action={
            <Button onClick={() => void tenants.refetch()} type="button" variant="outline">
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          }
          title="Nao foi possivel carregar os tenants."
        >
          Verifique a sessao e a conexao com a API.
        </EmptyState>
      ) : null}
      {tenants.isSuccess ? <TenantTable tenants={tenants.data} /> : null}
    </PageShell>
  );
}

function CreateTenantDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus className="size-4" />
          Novo tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Novo tenant</DialogTitle>
          <DialogDescription>
            Defina a organizacao, o slug publico e o primeiro acesso administrativo.
          </DialogDescription>
        </DialogHeader>
        <CreateTenantForm />
      </DialogContent>
    </Dialog>
  );
}

function CreateTenantForm() {
  const queryClient = useQueryClient();
  const createTenant = useMutation({
    mutationFn: createSystemTenant,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Tenant criado.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const form = useForm({
    defaultValues: {
      name: "",
      ownerEmail: "",
      ownerRole: "owner" as TenantOwnerRole,
      slug: "",
    },
    onSubmit: async ({ value }) => {
      const payload = createTenantSchema.parse(value) satisfies CreateSystemTenantRequestContract;
      await createTenant.mutateAsync(payload);
      form.reset();
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-[minmax(180px,1fr)_minmax(160px,220px)]"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        children={(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Nome</Label>
            <Input
              id={field.name}
              maxLength={160}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="Downtown Table Tennis"
              required
              value={field.state.value}
            />
          </div>
        )}
      />
      <form.Field
        name="slug"
        children={(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Slug</Label>
            <Input
              id={field.name}
              maxLength={63}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="downtown-ttc"
              required
              value={field.state.value}
            />
          </div>
        )}
      />
      <form.Field
        name="ownerEmail"
        children={(field) => (
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor={field.name}>Owner</Label>
            <Input
              id={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="owner@example.com"
              required
              type="email"
              value={field.state.value}
            />
          </div>
        )}
      />
      <form.Field
        name="ownerRole"
        children={(field) => (
          <div className="grid gap-2">
            <Label>Perfil</Label>
            <Select
              onValueChange={(value) => field.handleChange(value as TenantOwnerRole)}
              value={field.state.value}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tenantOwnerRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role === "owner" ? "Dono" : "Admin"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />
      <div className="flex justify-end md:col-span-2">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          children={([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              <Plus className="size-4" />
              Criar tenant
            </Button>
          )}
        />
      </div>
    </form>
  );
}

function TenantOverview({ tenants }: { tenants: SystemTenantResponseContract[] }) {
  const activeTenants = tenants.filter((tenant) => tenant.active).length;
  const activeMemberships = tenants.reduce(
    (total, tenant) => total + tenant.activeMembershipCount,
    0,
  );
  const withoutAdmins = tenants.filter((tenant) => tenant.ownerAdminEmails.length === 0).length;
  const recentlyUpdated = tenants[0];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <TenantMetric label="Total" value={tenants.length} />
      <TenantMetric label="Ativos" value={activeTenants} />
      <TenantMetric label="Membros ativos" value={activeMemberships} />
      <TenantMetric
        label="Sem admins ativos"
        value={withoutAdmins}
        valueClassName={withoutAdmins > 0 ? "text-destructive" : undefined}
      />
      {recentlyUpdated ? (
        <div className="rounded-lg border bg-muted/20 p-4 md:col-span-4">
          <p className="text-xs font-medium text-muted-foreground">Ultima atualizacao</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 truncate font-medium">{recentlyUpdated.name}</p>
            <p className="text-sm text-muted-foreground">{formatDateTime(recentlyUpdated.updatedAt)}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TenantMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}

function TenantTable({ tenants }: { tenants: SystemTenantResponseContract[] }) {
  if (tenants.length === 0) {
    return (
      <EmptyState title="Nenhum tenant criado.">
        Use o formulario acima para criar o primeiro tenant e seu acesso inicial.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Membros ativos</TableHead>
            <TableHead>Admins</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TenantRow key={tenant.id} tenant={tenant} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TenantRow({ tenant }: { tenant: SystemTenantResponseContract }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-56 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="size-4" />
          </span>
          <span className="grid min-w-0">
            <span className="truncate font-medium">{tenant.name}</span>
            <span className="truncate font-mono text-xs text-muted-foreground">{tenant.slug}</span>
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={tenant.active ? "default" : "secondary"}>
          {tenant.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{tenant.activeMembershipCount}</TableCell>
      <TableCell className="max-w-60 truncate text-muted-foreground">
        {tenant.ownerAdminEmails.join(", ") || "Sem admins ativos"}
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDateTime(tenant.updatedAt)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ tenantId: tenant.id }}
              to="/admin/tenants/$tenantId/memberships"
            >
              <UsersRound className="size-4" />
              Membros
            </Link>
          </Button>
          <EditTenantDialog tenant={tenant} />
        </div>
      </TableCell>
    </TableRow>
  );
}

function EditTenantDialog({ tenant }: { tenant: SystemTenantResponseContract }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [active, setActive] = useState(tenant.active);
  const updateTenant = useMutation({
    mutationFn: (payload: UpdateSystemTenantRequestContract) => updateSystemTenant(tenant.id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success("Tenant atualizado.");
      setOpen(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const payload = useMemo<UpdateSystemTenantRequestContract>(() => {
    const next: UpdateSystemTenantRequestContract = {};
    if (name.trim() !== tenant.name) next.name = name.trim();
    if (slug.trim() !== tenant.slug) next.slug = slug.trim();
    if (active !== tenant.active) next.active = active;
    return next;
  }, [active, name, slug, tenant.active, tenant.name, tenant.slug]);
  const hasChanges = Object.keys(payload).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon-sm" title="Editar tenant" type="button" variant="ghost">
          <Pencil className="size-4" />
          <span className="sr-only">Editar {tenant.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar tenant</DialogTitle>
          <DialogDescription>Atualize nome, slug ou status operacional.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!hasChanges) {
              toast.error("Altere ao menos um campo.");
              return;
            }
            updateTenant.mutate(payload);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor={`tenant-name-${tenant.id}`}>Nome</Label>
            <Input
              id={`tenant-name-${tenant.id}`}
              maxLength={160}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`tenant-slug-${tenant.id}`}>Slug</Label>
            <Input
              id={`tenant-slug-${tenant.id}`}
              maxLength={63}
              onChange={(event) => setSlug(event.target.value)}
              required
              value={slug}
            />
          </div>
          <label className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
            <input checked={active} onChange={(event) => setActive(event.target.checked)} type="checkbox" />
            Tenant ativo
          </label>
          <Button disabled={updateTenant.isPending || !hasChanges} type="submit">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TenantTableSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-14 rounded-lg border bg-muted/30" key={index} />
      ))}
    </div>
  );
}
