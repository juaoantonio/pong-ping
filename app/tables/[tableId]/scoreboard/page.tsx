import { notFound } from "next/navigation";
import { RealtimeScoreboard } from "@/components/scoreboard/realtime-scoreboard";
import { requireAuth } from "@/lib/auth/session";
import { getTableScoreboard } from "@/lib/tables/queries";

type ScoreboardPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function ScoreboardPage({ params }: ScoreboardPageProps) {
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { tableId }] = await Promise.all([userPromise, paramsPromise]);
  const table = await getTableScoreboard(tableId, user.id);

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
