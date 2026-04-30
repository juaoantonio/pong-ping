"use client";

import {
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref, runTransaction, set } from "firebase/database";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { realtimeDatabase } from "@/lib/firebase";
import { userLabel } from "@/lib/client-utils";
import {
  awardSet,
  changePlayerPoint,
  coerceScoreboardState,
  createInitialScoreboardState,
  resetCurrentSet,
  type ScoreboardPlayer,
  type ScoreboardState,
  shouldCreateFreshState,
} from "@/lib/scoreboard/state";

type RealtimeScoreboardProps = {
  currentPlayers: ScoreboardPlayer[];
  initialState?: ScoreboardState | null;
  tableId: string;
  tableName: string;
  viewerCanControl: boolean;
};

export function RealtimeScoreboard({
  currentPlayers,
  initialState = null,
  tableId,
  tableName,
  viewerCanControl,
}: RealtimeScoreboardProps) {
  const roundPlayers = useMemo(() => {
    if (currentPlayers.length < 2) {
      return null;
    }

    return [currentPlayers[0], currentPlayers[1]] as [
      ScoreboardPlayer,
      ScoreboardPlayer,
    ];
  }, [currentPlayers]);
  const [board, setBoard] = useState<ScoreboardState | null>(initialState);
  const [fullscreen, setFullscreen] = useState(false);

  const boardPath = `scoreboards/${tableId}/current`;
  const loading = Boolean(roundPlayers && !board);

  useEffect(() => {
    if (!roundPlayers) {
      return;
    }

    const boardRef = ref(realtimeDatabase, boardPath);

    return onValue(
      boardRef,
      (snapshot) => {
        const liveState = coerceScoreboardState(snapshot.val());

        if (shouldCreateFreshState(liveState, tableId, roundPlayers)) {
          const freshState = createInitialScoreboardState({
            players: roundPlayers,
            tableId,
          });

          setBoard(freshState);
          set(boardRef, freshState).catch(() => {
            toast.error("Nao foi possivel iniciar o placar.");
          });
        } else {
          setBoard(liveState);
        }
      },
      () => {
        toast.error("Nao foi possivel acompanhar o placar em tempo real.");
      },
    );
  }, [boardPath, roundPlayers, tableId]);

  useEffect(() => {
    function syncFullscreenState() {
      setFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  if (!roundPlayers) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-50">
        <div className="max-w-xl text-center">
          <p className="text-sm uppercase tracking-normal text-red-300">
            {tableName}
          </p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-5xl">
            Aguardando jogadores
          </h1>
          <p className="mt-4 text-zinc-300">
            A mesa precisa de dois jogadores na fila para abrir o placar.
          </p>
        </div>
      </main>
    );
  }

  const visibleBoard =
    board ??
    createInitialScoreboardState({ players: roundPlayers, tableId, now: 0 });

  function mutateBoard(mutation: (state: ScoreboardState) => ScoreboardState) {
    if (!viewerCanControl || !roundPlayers) {
      return;
    }

    const boardRef = ref(realtimeDatabase, boardPath);

    runTransaction(boardRef, (currentData) => {
      const currentState = coerceScoreboardState(currentData);
      const baseState: ScoreboardState = shouldCreateFreshState(
        currentState,
        tableId,
        roundPlayers,
      )
        ? createInitialScoreboardState({ players: roundPlayers, tableId })
        : currentState!;

      return mutation(baseState);
    }).catch(() => {
      toast.error("Nao foi possivel atualizar o placar.");
    });
  }

  function writeReset(nextState: ScoreboardState) {
    if (!viewerCanControl) {
      return;
    }

    set(ref(realtimeDatabase, boardPath), nextState).catch(() => {
      toast.error("Nao foi possivel redefinir o placar.");
    });
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    void document.documentElement.requestFullscreen();
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium uppercase tracking-normal text-red-300">
              {tableName}
            </p>
            <h1 className="truncate text-2xl font-semibold sm:text-4xl">
              Placar ao vivo
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
              Set {visibleBoard.setNumber}
            </div>
            <Button
              aria-label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
              onClick={toggleFullscreen}
              size="icon"
              variant="secondary"
            >
              {fullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-stretch">
          <ScoreboardPlayerPanel
            canControl={viewerCanControl}
            isLoading={loading}
            onAddPoint={() =>
              mutateBoard((state) => changePlayerPoint(state, 0, 1))
            }
            onAwardSet={() => mutateBoard((state) => awardSet(state, 0))}
            onRemovePoint={() =>
              mutateBoard((state) => changePlayerPoint(state, 0, -1))
            }
            player={visibleBoard.players[0]}
            points={visibleBoard.points[0]}
            sets={visibleBoard.sets[0]}
            side="Jogador 1"
          />
          <div className="flex items-center justify-center">
            <div className="border border-zinc-700 px-5 py-3 text-2xl font-semibold text-zinc-300">
              vs
            </div>
          </div>
          <ScoreboardPlayerPanel
            canControl={viewerCanControl}
            isLoading={loading}
            onAddPoint={() =>
              mutateBoard((state) => changePlayerPoint(state, 1, 1))
            }
            onAwardSet={() => mutateBoard((state) => awardSet(state, 1))}
            onRemovePoint={() =>
              mutateBoard((state) => changePlayerPoint(state, 1, -1))
            }
            player={visibleBoard.players[1]}
            points={visibleBoard.points[1]}
            sets={visibleBoard.sets[1]}
            side="Jogador 2"
          />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-400">
            {viewerCanControl
              ? "Controles liberados para membros da mesa."
              : "Modo espectador."}
          </p>
          {viewerCanControl ? (
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={loading}
                onClick={() => writeReset(resetCurrentSet(visibleBoard))}
                variant="ghost"
              >
                <RotateCcw className="size-4" />
                Zerar set
              </Button>
              <Button
                disabled={loading}
                onClick={() =>
                  writeReset(
                    createInitialScoreboardState({
                      players: roundPlayers,
                      tableId,
                    }),
                  )
                }
                variant="secondary"
              >
                <RotateCcw className="size-4" />
                Zerar partida
              </Button>
            </div>
          ) : null}
        </footer>
      </div>
    </main>
  );
}

function ScoreboardPlayerPanel({
  canControl,
  isLoading,
  onAddPoint,
  onAwardSet,
  onRemovePoint,
  player,
  points,
  sets,
  side,
}: {
  canControl: boolean;
  isLoading: boolean;
  onAddPoint: () => void;
  onAwardSet: () => void;
  onRemovePoint: () => void;
  player: ScoreboardPlayer;
  points: number;
  sets: number;
  side: string;
}) {
  const name = userLabel(player);

  return (
    <article className="grid min-h-[34rem] grid-rows-[auto_1fr_auto] border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium uppercase tracking-normal text-zinc-400">
          {side}
        </span>
        <span className="border border-zinc-700 px-3 py-1 text-sm">
          Sets {sets}
        </span>
      </div>

      <div className="grid place-items-center gap-4 py-6 text-center">
        <UserAvatar
          className="size-24 text-3xl sm:size-32"
          name={name}
          src={player.avatarUrl}
        />
        <div className="min-w-0">
          <h2 className="max-w-[18rem] truncate text-3xl font-semibold sm:max-w-[28rem] sm:text-5xl">
            {name}
          </h2>
          <p className="mt-4 text-[8rem] font-black leading-none tabular-nums sm:text-[12rem] lg:text-[16rem]">
            {points}
          </p>
        </div>
      </div>

      {canControl ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            aria-label={`Remover ponto de ${name}`}
            disabled={isLoading}
            onClick={onRemovePoint}
            size="lg"
            variant="ghost"
          >
            <Minus className="size-4" />
            Ponto
          </Button>
          <Button
            aria-label={`Adicionar ponto para ${name}`}
            disabled={isLoading}
            onClick={onAddPoint}
            size="lg"
          >
            <Plus className="size-4" />
            Ponto
          </Button>
          <Button
            aria-label={`Novo set para ${name}`}
            disabled={isLoading}
            onClick={onAwardSet}
            size="lg"
            variant={"secondary"}
          >
            <Trophy className="size-4" />
            Novo set
          </Button>
        </div>
      ) : null}
    </article>
  );
}
