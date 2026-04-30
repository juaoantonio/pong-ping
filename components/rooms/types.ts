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

export type RoomMember = {
  joinedAt: string;
  user: UserOption;
};

export type RoomMatch = {
  id: string;
  kind: "match" | "rollback";
  rollbackOfId: string | null;
  rolledBack: boolean;
  createdAt: string;
  winnerOldElo: number;
  winnerNewElo: number;
  winnerDiffPoints: number;
  loserOldElo: number;
  loserNewElo: number;
  loserDiffPoints: number;
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
    oneTimeUse: boolean;
  } | null;
  participants: RoomParticipant[];
  members: RoomMember[];
  viewerIsMember: boolean;
  viewerIsQueued: boolean;
  viewerIsPlaying: boolean;
  viewerQueuePosition: number | null;
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
