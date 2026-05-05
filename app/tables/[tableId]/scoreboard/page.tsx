import { notFound, redirect } from "next/navigation";
import { RealtimeScoreboard } from "@/components/scoreboard/realtime-scoreboard";
import { requireAuth } from "@/lib/auth/session";
import { getTableScoreboard } from "@/lib/tables/queries";
import { getActorTenantId } from "@/lib/tables/tenant";

type ScoreboardPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function ScoreboardPage({ params }: ScoreboardPageProps) {
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { tableId }] = await Promise.all([userPromise, paramsPromise]);
  const tenantId = getActorTenantId(user);

  if (!tenantId) {
    redirect("/unauthorized");
  }

  const table = await getTableScoreboard(tableId, user.id, tenantId);

  if (!table) {
    notFound();
  }

  return (
    <RealtimeScoreboard
      currentPlayers={table.currentPlayers}
      tableId={table.id}
      tableName={table.name}
      viewerCanControl={table.viewerIsMember}
    />
  );
}
