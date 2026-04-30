export type ScoreboardPlayer = {
  id: string;
  name: string | null;
  avatarUrl: string | null;
};

export type ScoreboardState = {
  tableId: string;
  roundKey: string;
  updatedAt: number;
  players: [ScoreboardPlayer, ScoreboardPlayer];
  points: [number, number];
  sets: [number, number];
  setNumber: number;
};

export function getRoundKey(players: [ScoreboardPlayer, ScoreboardPlayer]) {
  return players.map((player) => player.id).join(":");
}

export function createInitialScoreboardState({
  now = Date.now(),
  players,
  tableId,
}: {
  now?: number;
  players: [ScoreboardPlayer, ScoreboardPlayer];
  tableId: string;
}): ScoreboardState {
  return {
    tableId,
    roundKey: getRoundKey(players),
    updatedAt: now,
    players,
    points: [0, 0],
    sets: [0, 0],
    setNumber: 1,
  };
}

export function shouldCreateFreshState(
  state: ScoreboardState | null | undefined,
  tableId: string,
  players: [ScoreboardPlayer, ScoreboardPlayer],
) {
  return (
    !state ||
    state.tableId !== tableId ||
    state.roundKey !== getRoundKey(players) ||
    state.players[0]?.id !== players[0].id ||
    state.players[1]?.id !== players[1].id
  );
}

export function coerceScoreboardState(value: unknown): ScoreboardState | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const state = value as Partial<ScoreboardState>;

  if (
    typeof state.tableId !== "string" ||
    typeof state.roundKey !== "string" ||
    !Array.isArray(state.players) ||
    state.players.length !== 2 ||
    !Array.isArray(state.points) ||
    state.points.length !== 2 ||
    !Array.isArray(state.sets) ||
    state.sets.length !== 2
  ) {
    return null;
  }

  return {
    tableId: state.tableId,
    roundKey: state.roundKey,
    updatedAt:
      typeof state.updatedAt === "number" ? state.updatedAt : Date.now(),
    players: [
      coercePlayer(state.players[0]),
      coercePlayer(state.players[1]),
    ],
    points: [coerceCount(state.points[0]), coerceCount(state.points[1])],
    sets: [coerceCount(state.sets[0]), coerceCount(state.sets[1])],
    setNumber: coerceCount(state.setNumber, 1),
  };
}

export function changePlayerPoint(
  state: ScoreboardState,
  playerIndex: 0 | 1,
  delta: 1 | -1,
  now = Date.now(),
): ScoreboardState {
  const points: [number, number] = [...state.points];
  points[playerIndex] = Math.max(0, points[playerIndex] + delta);

  return {
    ...state,
    points,
    updatedAt: now,
  };
}

export function awardSet(
  state: ScoreboardState,
  playerIndex: 0 | 1,
  now = Date.now(),
): ScoreboardState {
  const sets: [number, number] = [...state.sets];
  sets[playerIndex] += 1;

  return {
    ...state,
    points: [0, 0],
    sets,
    setNumber: state.setNumber + 1,
    updatedAt: now,
  };
}

export function resetCurrentSet(
  state: ScoreboardState,
  now = Date.now(),
): ScoreboardState {
  return {
    ...state,
    points: [0, 0],
    updatedAt: now,
  };
}

function coercePlayer(value: unknown): ScoreboardPlayer {
  const player = value as Partial<ScoreboardPlayer> | null;

  return {
    id: typeof player?.id === "string" ? player.id : "",
    name:
      typeof player?.name === "string" || player?.name === null
        ? player.name
        : null,
    avatarUrl:
      typeof player?.avatarUrl === "string" || player?.avatarUrl === null
        ? player.avatarUrl
        : null,
  };
}

function coerceCount(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}
