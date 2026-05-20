import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import type {
  ActiveGameResponseContract,
  AthleteProfileContract,
  GameRecordResponseContract,
  GameSideResponseContract,
  TableResponseContract,
} from "@pong-ping/contracts";
import { EmptyState } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export function QueryState({
  children,
  isError,
  isLoading,
  onRetry,
}: {
  children: ReactNode;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-3">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        action={
          <Button onClick={onRetry} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Tentar novamente
          </Button>
        }
        title="Nao foi possivel carregar os dados."
      >
        A API retornou uma falha ou a sessao nao esta mais valida.
      </EmptyState>
    );
  }

  return children;
}

export function SkeletonBlock() {
  return <div className="h-32 animate-pulse rounded-lg border bg-muted/40" />;
}

export function MetricTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "default" | "strong";
}) {
  return (
    <section
      className={cn(
        "grid min-h-28 content-between gap-3 rounded-lg border bg-card p-4 shadow-sm",
        tone === "strong" ? "border-primary/40 bg-primary/5" : null,
      )}
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-normal">{value}</p>
    </section>
  );
}

export function SectionPanel({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className="grid gap-4 rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function activeGameLabel(activeGame: ActiveGameResponseContract | null) {
  if (!activeGame) return "Sem jogo ativo";
  return `${sideLabel(activeGame.firstSide)} vs ${sideLabel(activeGame.secondSide)}`;
}

export function sideLabel(side: GameSideResponseContract) {
  return side.athleteIds.join(" / ");
}

export function tableStatus(table: TableResponseContract) {
  if (table.activeGame) return "Jogo ativo";
  if (table.queue.length > 0) return `${table.queue.length} na fila`;
  return "Fila vazia";
}

export function profileValue(value: string | null | undefined) {
  return value?.trim() || "Nao informado";
}

export function profileSummary(profile: AthleteProfileContract) {
  return [
    profileValue(profile.technicalLevel),
    profileValue(profile.gripStyle),
    profileValue(profile.playingStyle),
  ].join(" · ");
}

export function GameSummary({ game }: { game: GameRecordResponseContract }) {
  return (
    <div className="grid gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{sideLabel(game.winningSide)}</span>
        <span className="text-muted-foreground">venceu</span>
        <span className="font-medium">{sideLabel(game.losingSide)}</span>
        {game.isCorrection ? <Badge variant="secondary">Correcao</Badge> : null}
        {game.correctionId ? <Badge variant="outline">Corrigido</Badge> : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Mesa {game.tableId} · {formatDateTime(game.finishedAt)}
      </p>
    </div>
  );
}

export function winRateLabel(value: number) {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}
