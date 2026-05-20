import { createFileRoute } from "@tanstack/react-router";
import { TablesPage } from "@/features/club/tables/tables-page";

export const Route = createFileRoute("/club/tables")({
  component: TablesPage,
});
