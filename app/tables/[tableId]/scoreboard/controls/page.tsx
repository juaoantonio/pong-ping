import { notFound, redirect } from "next/navigation";
import { ScoreboardControls } from "@/components/scoreboard/scoreboard-controls";
import { requireAuth } from "@/lib/auth/session";
import { getTableScoreboard } from "@/lib/tables/queries";
import type { ScoreboardPlayer } from "@/lib/scoreboard/state";

type ScoreboardControlsPageProps = {
  params: Promise<{
    tableId: string;
  }>;
};

export default async function ScoreboardControlsPage({
  params,
}: ScoreboardControlsPageProps) {
  const userPromise = requireAuth();
  const paramsPromise = params;

  const [user, { tableId }] = await Promise.all([userPromise, paramsPromise]);
  const table = await getTableScoreboard(tableId, user.id);

  if (!table) {
    notFound();
  }

  if (
    table.currentPlayers.length !== 2 ||
    (table.viewerCurrentPlayerIndex !== 0 &&
      table.viewerCurrentPlayerIndex !== 1)
  ) {
    redirect("/unauthorized");
  }

  return (
    <ScoreboardControls
      currentPlayers={
        table.currentPlayers as [ScoreboardPlayer, ScoreboardPlayer]
      }
      playerIndex={table.viewerCurrentPlayerIndex}
      tableId={table.id}
      tableName={table.name}
    />
  );
}
