export function rotateQueueAfterMatch(queueParticipantIds: string[], winnerParticipantId: string) {
  if (queueParticipantIds.length < 2) {
    throw new Error("not_enough_players");
  }

  const currentPlayers = queueParticipantIds.slice(0, 2);

  if (!currentPlayers.includes(winnerParticipantId)) {
    throw new Error("winner_not_in_current_match");
  }

  const loserParticipantId = currentPlayers.find((participantId) => participantId !== winnerParticipantId);

  if (!loserParticipantId) {
    throw new Error("loser_not_found");
  }

  return [winnerParticipantId, ...queueParticipantIds.slice(2), loserParticipantId];
}
