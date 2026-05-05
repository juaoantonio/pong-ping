export * from "../../scoreboard/state";

export function getCurrentScoreboardPath(tableId: string): string {
  return `scoreboards/${tableId}/current`;
}
