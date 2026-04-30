"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { onValue, ref, runTransaction, set } from "firebase/database";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { realtimeDatabase } from "@/lib/firebase";
import { userLabel } from "@/lib/client-utils";
import {
  changePlayerPoint,
  coerceScoreboardState,
  createInitialScoreboardState,
  shouldCreateFreshState,
  type ScoreboardPlayer,
  type ScoreboardState,
} from "@/lib/scoreboard/state";

type ScoreboardControlsProps = {
  currentPlayers: [ScoreboardPlayer, ScoreboardPlayer];
  playerIndex: 0 | 1;
  tableId: string;
  tableName: string;
};

export function ScoreboardControls({
  currentPlayers,
  playerIndex,
  tableId,
  tableName,
}: ScoreboardControlsProps) {
  const roundPlayers = useMemo(
    () => currentPlayers,
    [currentPlayers],
  );
  const [board, setBoard] = useState<ScoreboardState | null>(null);
  const boardPath = `scoreboards/${tableId}/current`;
  const player = roundPlayers[playerIndex];
  const playerName = userLabel(player);
  const points = board?.points[playerIndex] ?? 0;

  useEffect(() => {
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

  function changePoint(delta: 1 | -1) {
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

      return changePlayerPoint(baseState, playerIndex, delta);
    }).catch(() => {
      toast.error("Nao foi possivel atualizar o placar.");
    });
  }

  return (
    <main className="min-h-dvh bg-black text-zinc-50">
      <div className="grid min-h-dvh grid-rows-[auto_1fr] p-3">
        <header className="grid gap-3 border border-zinc-800 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar
              className="size-14 shrink-0 text-xl"
              name={playerName}
              src={player.avatarUrl}
            />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-normal text-zinc-500">
                {tableName}
              </p>
              <h1 className="truncate text-2xl font-semibold">{playerName}</h1>
            </div>
          </div>
          <div className="grid grid-cols-2 border border-zinc-800">
            <div className="border-r border-zinc-800 p-3">
              <p className="text-xs uppercase tracking-normal text-zinc-500">
                Pontos
              </p>
              <p className="text-5xl font-black tabular-nums">{points}</p>
            </div>
            <div className="p-3">
              <p className="text-xs uppercase tracking-normal text-zinc-500">
                Set
              </p>
              <p className="text-5xl font-black tabular-nums">
                {board?.setNumber ?? 1}
              </p>
            </div>
          </div>
        </header>

        <section className="grid min-h-0 grid-rows-[2fr_1fr] gap-3 pt-3">
          <button
            aria-label={`Adicionar ponto para ${playerName}`}
            className="grid min-h-0 touch-manipulation place-items-center border border-green-500 bg-green-500 text-black active:bg-green-300 disabled:opacity-50"
            disabled={!board}
            onClick={() => changePoint(1)}
            type="button"
          >
            <span className="flex items-center gap-4 text-[clamp(5rem,30vw,13rem)] font-black leading-none">
              <Plus className="size-[0.65em]" />
              1
            </span>
          </button>
          <button
            aria-label={`Remover ponto de ${playerName}`}
            className="grid min-h-0 touch-manipulation place-items-center border border-zinc-700 bg-zinc-950 text-zinc-50 active:bg-zinc-800 disabled:opacity-50"
            disabled={!board}
            onClick={() => changePoint(-1)}
            type="button"
          >
            <span className="flex items-center gap-4 text-[clamp(3.75rem,22vw,8rem)] font-black leading-none">
              <Minus className="size-[0.65em]" />
              1
            </span>
          </button>
        </section>
      </div>
    </main>
  );
}
