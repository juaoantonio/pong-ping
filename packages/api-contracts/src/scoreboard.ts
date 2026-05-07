export interface ScoreboardPlayerDto {
  id: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface ScoreboardTableDto {
  id: string;
  name: string;
  currentPlayers: ScoreboardPlayerDto[];
  viewerCurrentPlayerIndex: number;
  viewerIsMember: boolean;
}

export interface ScoreboardResponseDataDto {
  table: ScoreboardTableDto | null;
}
