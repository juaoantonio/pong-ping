import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, RefreshCw, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type {
  CreateSystemMembershipRequestContract,
  SystemMembershipResponseContract,
} from "@pong-ping/contracts";
import { EmptyState, PageShell } from "@/components/layout/page-shell";
import { RolePicker } from "@/features/system-admin/role-picker";
import { roleLabel, type TenantRole } from "@/features/system-admin/roles";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiClientError } from "@/lib/api/errors";
import {
  createSystemMembership,
  deactivateSystemMembership,
  systemMembershipsQueryOptions,
  systemTenantsQueryOptions,
  tenantKeys,
  updateSystemMembership,
} from "@/lib/api/system-admin";
import { formatDateTime } from "@/lib/format";
import { Route } from "@/routes/admin/tenants.$tenantId.memberships";

const createMembershipSchema = z.object({
  email: z.email("Informe um email valido."),
  roles: z.array(z.enum(["owner", "admin", "member"])).min(1, "Selecione ao menos um perfil."),
});

function errorMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "Nao foi possivel concluir a acao.";
}

export function MembershipsPage() {
  const { tenantId } = Route.useParams();
  const memberships = useQuery(systemMembershipsQueryOptions(tenantId));
  const tenants = useQuery(systemTenantsQueryOptions());
  const tenant = tenants.data?.find((item) => item.id === tenantId);
  const membershipData = memberships.data ?? [];

  return (
    <PageShell
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/tenants">
              <ArrowLeft className="size-4" />
              Tenants
            </Link>
          </Button>
          <CreateMembershipDialog tenantId={tenantId} />
        </div>
      }
      description={
        tenant
          ? `Gerencie acessos para ${tenant.name}.`
          : "Gerencie perfis, status e revogacoes de acesso deste tenant."
      }
      eyebrow="Membros do tenant"
      title={tenant?.name ?? "Memberships"}
    >
      {memberships.isSuccess ? (
        <MembershipOverview memberships={membershipData} tenantSlug={tenant?.slug} />
      ) : null}
      {memberships.isLoading ? <MembershipTableSkeleton /> : null}
      {memberships.isError ? (
        <EmptyState
          action={
            <Button onClick={() => void memberships.refetch()} type="button" variant="outline">
              <RefreshCw className="size-4" />
              Tentar novamente
            </Button>
          }
          title="Nao foi possivel carregar os membros."
        >
          Verifique a sessao, o tenant e a conexao com a API.
        </EmptyState>
      ) : null}
      {memberships.isSuccess ? (
        <MembershipTable memberships={memberships.data} tenantId={tenantId} />
      ) : null}
    </PageShell>
  );
}

function CreateMembershipDialog({ tenantId }: { tenantId: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">
          <UserPlus className="size-4" />
          Novo membro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo membro</DialogTitle>
          <DialogDescription>
            Conceda acesso inicial e defina os perfis deste usuario no tenant.
          </DialogDescription>
        </DialogHeader>
        <CreateMembershipForm tenantId={tenantId} />
      </DialogContent>
    </Dialog>
  );
}

function CreateMembershipForm({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const createMembership = useMutation({
    mutationFn: (payload: CreateSystemMembershipRequestContract) =>
      createSystemMembership(tenantId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tenantKeys.memberships(tenantId) }),
        queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
      ]);
      toast.success("Membership atualizado.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const form = useForm({
    defaultValues: {
      email: "",
      roles: ["member"] as TenantRole[],
    },
    onSubmit: async ({ value }) => {
      const payload = createMembershipSchema.parse(value) satisfies CreateSystemMembershipRequestContract;
      await createMembership.mutateAsync(payload);
      form.reset();
    },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        children={(field) => (
          <div className="grid gap-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              placeholder="member@example.com"
              required
              type="email"
              value={field.state.value}
            />
          </div>
        )}
      />
      <form.Field
        name="roles"
        children={(field) => (
          <div className="grid gap-2">
            <Label>Perfis</Label>
            <RolePicker onChange={field.handleChange} value={field.state.value} />
          </div>
        )}
      />
      <div className="flex justify-end">
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          children={([canSubmit, isSubmitting]) => (
            <Button disabled={!canSubmit || isSubmitting} type="submit">
              <UserPlus className="size-4" />
              Adicionar membro
            </Button>
          )}
        />
      </div>
    </form>
  );
}

function MembershipOverview({
  memberships,
  tenantSlug,
}: {
  memberships: SystemMembershipResponseContract[];
  tenantSlug?: string;
}) {
  const activeMemberships = memberships.filter((membership) => membership.active).length;
  const owners = memberships.filter((membership) => membership.roles.includes("owner")).length;
  const admins = memberships.filter((membership) => membership.roles.includes("admin")).length;
  const inactiveMemberships = memberships.length - activeMemberships;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <MembershipMetric label="Ativos" value={activeMemberships} />
      <MembershipMetric label="Owners" value={owners} />
      <MembershipMetric label="Admins" value={admins} />
      <MembershipMetric label="Inativos" value={inactiveMemberships} />
      {tenantSlug ? (
        <div className="rounded-lg border bg-muted/20 p-4 md:col-span-4">
          <p className="text-xs font-medium text-muted-foreground">Slug do tenant</p>
          <p className="mt-2 truncate font-mono text-sm">{tenantSlug}</p>
        </div>
      ) : null}
    </div>
  );
}

function MembershipMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MembershipTable({
  memberships,
  tenantId,
}: {
  memberships: SystemMembershipResponseContract[];
  tenantId: string;
}) {
  if (memberships.length === 0) {
    return (
      <EmptyState title="Nenhum membership neste tenant.">
        O formulario continua disponivel para conceder o primeiro acesso.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Perfis</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Atualizado em</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((membership) => (
            <MembershipRow key={membership.id} membership={membership} tenantId={tenantId} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MembershipRow({
  membership,
  tenantId,
}: {
  membership: SystemMembershipResponseContract;
  tenantId: string;
}) {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState<TenantRole[]>([...membership.roles]);
  const updateMembership = useMutation({
    mutationFn: () => updateSystemMembership(tenantId, membership.id, { roles }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tenantKeys.memberships(tenantId) }),
        queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
      ]);
      toast.success("Perfis atualizados.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const toggleActive = useMutation({
    mutationFn: () => updateSystemMembership(tenantId, membership.id, { active: !membership.active }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tenantKeys.memberships(tenantId) }),
        queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
      ]);
      toast.success("Status atualizado.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const deactivate = useMutation({
    mutationFn: () => deactivateSystemMembership(tenantId, membership.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: tenantKeys.memberships(tenantId) }),
        queryClient.invalidateQueries({ queryKey: tenantKeys.all }),
      ]);
      toast.success("Membership desativado.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const rolesChanged = roles.join("|") !== membership.roles.join("|");

  return (
    <TableRow>
      <TableCell>
        <span className="grid min-w-0">
          <span className="truncate font-medium">{membership.email}</span>
          <span className="truncate font-mono text-xs text-muted-foreground">{membership.userId}</span>
        </span>
      </TableCell>
      <TableCell>
        <div className="grid gap-2">
          <RolePicker onChange={setRoles} value={roles} />
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {membership.roles.map((role) => (
              <span key={role}>{roleLabel(role)}</span>
            ))}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={membership.active ? "default" : "secondary"}>
          {membership.active ? "Ativo" : "Inativo"}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{formatDateTime(membership.updatedAt)}</TableCell>
      <TableCell>
        <div className="flex justify-end gap-2">
          <Button
            disabled={!rolesChanged || roles.length === 0 || updateMembership.isPending}
            onClick={() => updateMembership.mutate()}
            size="sm"
            type="button"
            variant="outline"
          >
            <ShieldCheck className="size-4" />
            Salvar
          </Button>
          <Button
            disabled={toggleActive.isPending}
            onClick={() => toggleActive.mutate()}
            size="sm"
            type="button"
            variant="outline"
          >
            {membership.active ? "Inativar" : "Reativar"}
          </Button>
          <Button
            disabled={deactivate.isPending || !membership.active}
            onClick={() => {
              if (window.confirm(`Desativar ${membership.email}?`)) {
                deactivate.mutate();
              }
            }}
            size="icon-sm"
            title="Desativar membership"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Desativar {membership.email}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MembershipTableSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="h-14 rounded-lg border bg-muted/30" key={index} />
      ))}
    </div>
  );
}
