export enum MatchState {
  PENDING_ACCEPTANCE = "PENDING_ACCEPTANCE",
  ACTIVE = "ACTIVE",
  SCORE_SUBMITTED = "SCORE_SUBMITTED",
  PENDING_VERIFICATION = "PENDING_VERIFICATION",
  COMPLETED = "COMPLETED",
  DISPUTED = "DISPUTED",
  ADMIN_REVIEW = "ADMIN_REVIEW",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  AUTO_FORFEIT = "AUTO_FORFEIT",
}

export enum MatchType {
  FRIEND_CHALLENGE = "FRIEND_CHALLENGE",
  RANKED = "RANKED",
  QUICK_XP = "QUICK_XP",
  CLUB_BATTLE = "CLUB_BATTLE",
}

export enum Platform {
  PS5 = "PS5",
  PS4 = "PS4",
  XBOX = "XBOX",
  PC = "PC",
}

export enum Region {
  ZW = "ZW",
  AFRICA = "AFRICA",
  EU = "EU",
  NA = "NA",
  ASIA = "ASIA",
  OC = "OC",
}

export interface ScoreSubmission {
  playerId: string;
  score: number;
  opponentScore: number;
  screenshots: string[];
  videoUrl?: string;
  rageQuit: boolean;
  submittedAt: Date;
}

export interface VerificationData {
  confirmedBy: string;
  confirmedAt: Date;
  disputed: boolean;
  disputeReason?: string;
}

export interface AntiCheatMetadata {
  ipHash: string;
  deviceHash: string;
  userAgent: string;
  matchDuration: number;
  scoreSpeed: number;
  previousOpponents: string[];
  timeSinceLastMatch: number;
  flags: string[];
}

export interface ChallengeTokenData {
  token: string;
  challengerId: string;
  opponentId: string | null;
  matchType: MatchType;
  platform: Platform;
  region: Region;
  wagerAmount: number;
  expiresAt: Date;
  used: boolean;
}

export interface MatchStateTransition {
  from: MatchState;
  to: MatchState;
  requiredRole?: "challenger" | "opponent" | "either" | "admin";
  reason?: string;
}
