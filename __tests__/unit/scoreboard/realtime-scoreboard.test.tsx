import { render, screen } from "@testing-library/react";
import { RealtimeScoreboard } from "@/components/scoreboard/realtime-scoreboard";
import {
  createInitialScoreboardState,
  type ScoreboardPlayer,
} from "@/lib/scoreboard/state";

jest.mock("@/lib/firebase", () => ({
  realtimeDatabase: {},
}));

jest.mock("firebase/database", () => ({
  onValue: jest.fn(() => jest.fn()),
  ref: jest.fn((database, path) => ({ database, path })),
  runTransaction: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
}));

const players: [ScoreboardPlayer, ScoreboardPlayer] = [
  { id: "user-a", name: "Ana", avatarUrl: null },
  { id: "user-b", name: "Bia", avatarUrl: null },
];

describe("RealtimeScoreboard", () => {
  it("hides score controls from non-members", () => {
    render(
      <RealtimeScoreboard
        currentPlayers={[...players]}
        initialState={createInitialScoreboardState({
          players,
          tableId: "table-1",
        })}
        tableId="table-1"
        tableName="Mesa 1"
        viewerCanControl={false}
      />,
    );

    expect(screen.getByText("Modo espectador.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /adicionar ponto/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /zerar partida/i }),
    ).not.toBeInTheDocument();
  });

  it("shows score controls to table members", () => {
    render(
      <RealtimeScoreboard
        currentPlayers={[...players]}
        initialState={createInitialScoreboardState({
          players,
          tableId: "table-1",
        })}
        tableId="table-1"
        tableName="Mesa 1"
        viewerCanControl
      />,
    );

    expect(
      screen.getByText("Controles liberados para membros da mesa."),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /adicionar ponto/i }),
    ).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: /zerar partida/i }),
    ).toBeInTheDocument();
  });

  it("shows an empty state when fewer than two current players exist", () => {
    render(
      <RealtimeScoreboard
        currentPlayers={[players[0]]}
        tableId="table-1"
        tableName="Mesa 1"
        viewerCanControl
      />,
    );

    expect(screen.getByText("Aguardando jogadores")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A mesa precisa de dois jogadores na fila para abrir o placar.",
      ),
    ).toBeInTheDocument();
  });
});
