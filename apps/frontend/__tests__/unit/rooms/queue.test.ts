import { rotateQueueAfterMatch } from "@/lib/rooms/queue";

describe("room queue", () => {
  it("keeps the winner on the table and sends the loser to the back", () => {
    expect(rotateQueueAfterMatch(["a", "b", "c", "d"], "a")).toEqual([
      "a",
      "c",
      "d",
      "b",
    ]);
    expect(rotateQueueAfterMatch(["a", "b", "c", "d"], "b")).toEqual([
      "b",
      "c",
      "d",
      "a",
    ]);
  });

  it("rejects invalid winners", () => {
    expect(() => rotateQueueAfterMatch(["a", "b"], "c")).toThrow(
      "winner_not_in_current_match",
    );
  });
});
