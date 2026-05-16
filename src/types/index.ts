export type LeagueType = 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
export type TournamentType = 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
export type TournamentFormat = 'KNOCKOUT' | 'GROUP_STAGE' | 'DOUBLE_ELIMINATION' | 'HYBRID';
export type MatchStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'FORFEIT' | 'CANCELLED';
export type MatchConfirmation = 'PENDING' | 'CONFIRMED' | 'DISPUTED';
export type ParticipantMode = '1V1' | '2V2' | 'TEAM';

export interface LeagueStanding {
  playerId: string; points: number; played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; form: string[]; cleanSheets: number;
}

export interface BracketNode {
  id: string; round: number; position: number; homePlayerId?: string; awayPlayerId?: string;
  homeScore?: number; awayScore?: number; winnerId?: string; nextMatchPosition?: string;
  status: MatchStatus; matchId?: string;
}

export interface GroupStanding {
  playerId: string; points: number; played: number; wins: number; draws: number; losses: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; form: string[];
}
