export type UserOption = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type UserIdentityLike = {
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
};

export type RoomParticipant = {
  id: string;
  queuePosition: number;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
    playerRanking: {
      elo: number;
      wins: number;
      total_matches: number;
      winRate: number;
    } | null;
  };
};

export type RoomMatch = {
  id: string;
  createdAt: string;
  winnerOldElo: number;
  winnerNewElo: number;
  loserOldElo: number;
  loserNewElo: number;
  winner: UserIdentityLike;
  loser: UserIdentityLike;
};

export type RoomSummary = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: UserIdentityLike;
  currentInvitation: {
    id: string;
    token: string;
    expiresAt: string;
  } | null;
  participants: RoomParticipant[];
  recentMatches: RoomMatch[];
};

export type RoomListItem = {
  id: string;
  name: string;
  createdAt: string;
  createdBy: UserIdentityLike;
  participantCount: number;
  currentPlayers: UserIdentityLike[];
  latestMatch: RoomMatch | null;
};
