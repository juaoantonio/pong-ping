import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RoundsAdmin,
  type RoundAdminFilters,
} from "@/app/admin/rounds/rounds-admin";
import { requireRole } from "@/lib/auth/session";
import { apiGet } from "@/lib/api/server";

type AdminRoundsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminRoundsPage({
  searchParams,
}: AdminRoundsPageProps) {
  await requireRole("superadmin");

  const params = await searchParams;
  const filters: RoundAdminFilters = {
    q: firstParam(params.q)?.trim() ?? "",
    roomId: firstParam(params.roomId)?.trim() ?? "",
    player: firstParam(params.player)?.trim() ?? "",
    createdBy: firstParam(params.createdBy)?.trim() ?? "",
    kind: firstParam(params.kind) ?? "all",
    status: firstParam(params.status) ?? "all",
    from: firstParam(params.from) ?? "",
    to: firstParam(params.to) ?? "",
  };

  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
  );
  const { rounds } = await apiGet<{
    rounds: Parameters<typeof RoundsAdmin>[0]["rounds"];
  }>(`/admin/rounds?${query.toString()}`);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <div>
        <p className="text-sm text-muted-foreground">Painel superadmin</p>
        <h1 className="text-2xl font-semibold">Rodadas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historico auditavel</CardTitle>
          <CardDescription>
            Todas as rodadas e rollbacks, incluindo o room id de origem.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoundsAdmin
            filters={filters}
            rounds={rounds}
          />
        </CardContent>
      </Card>
    </div>
  );
}
