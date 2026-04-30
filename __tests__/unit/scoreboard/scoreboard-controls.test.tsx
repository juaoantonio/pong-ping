import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { runTransaction } from "firebase/database";
import { ScoreboardControls } from "@/components/scoreboard/scoreboard-controls";
import type { ScoreboardPlayer } from "@/lib/scoreboard/state";

jest.mock("@/lib/firebase", () => ({
  realtimeDatabase: {},
}));

jest.mock("firebase/database", () => ({
  onValue: jest.fn((reference, callback) => {
    callback({
      val: () => ({
        tableId: "table-1",
        roundKey: "user-a:user-b",
        updatedAt: 100,
        players: [
          { id: "user-a", name: "Ana", avatarUrl: null },
          { id: "user-b", name: "Bia", avatarUrl: null },
        ],
        points: [0, 0],
        sets: [0, 0],
        setNumber: 1,
      }),
    });
    return jest.fn();
  }),
  ref: jest.fn((database, path) => ({ database, path })),
  runTransaction: jest.fn(() => Promise.resolve()),
  set: jest.fn(() => Promise.resolve()),
}));

const players: [ScoreboardPlayer, ScoreboardPlayer] = [
  { id: "user-a", name: "Ana", avatarUrl: null },
  { id: "user-b", name: "Bia", avatarUrl: null },
];

describe("ScoreboardControls", () => {
  it("renders large add and remove point controls for the current player", () => {
    render(
      <ScoreboardControls
        currentPlayers={players}
        playerIndex={0}
        tableId="table-1"
        tableName="Mesa 1"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ana" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /adicionar ponto para ana/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remover ponto de ana/i }),
    ).toBeInTheDocument();
  });

  it("updates only the signed-in player's side", async () => {
    const user = userEvent.setup();

    render(
      <ScoreboardControls
        currentPlayers={players}
        playerIndex={1}
        tableId="table-1"
        tableName="Mesa 1"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /adicionar ponto para bia/i }),
    );

    expect(runTransaction).toHaveBeenCalledTimes(1);
  });
});
