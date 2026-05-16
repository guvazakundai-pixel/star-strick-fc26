import { MatchState, type MatchStateTransition } from "./types";

const TRANSITIONS: MatchStateTransition[] = [
  { from: MatchState.PENDING_ACCEPTANCE, to: MatchState.ACTIVE, requiredRole: "opponent" },
  { from: MatchState.PENDING_ACCEPTANCE, to: MatchState.CANCELLED, requiredRole: "challenger" },
  { from: MatchState.PENDING_ACCEPTANCE, to: MatchState.EXPIRED },
  { from: MatchState.ACTIVE, to: MatchState.SCORE_SUBMITTED, requiredRole: "either" },
  { from: MatchState.ACTIVE, to: MatchState.AUTO_FORFEIT, requiredRole: "admin" },
  { from: MatchState.ACTIVE, to: MatchState.CANCELLED, requiredRole: "either" },
  { from: MatchState.SCORE_SUBMITTED, to: MatchState.PENDING_VERIFICATION, requiredRole: "opponent" },
  { from: MatchState.SCORE_SUBMITTED, to: MatchState.DISPUTED, requiredRole: "opponent" },
  { from: MatchState.SCORE_SUBMITTED, to: MatchState.AUTO_FORFEIT, requiredRole: "admin" },
  { from: MatchState.PENDING_VERIFICATION, to: MatchState.COMPLETED, requiredRole: "either" },
  { from: MatchState.PENDING_VERIFICATION, to: MatchState.DISPUTED, requiredRole: "either" },
  { from: MatchState.DISPUTED, to: MatchState.ADMIN_REVIEW, requiredRole: "admin" },
  { from: MatchState.ADMIN_REVIEW, to: MatchState.COMPLETED, requiredRole: "admin" },
  { from: MatchState.ADMIN_REVIEW, to: MatchState.CANCELLED, requiredRole: "admin" },
  { from: MatchState.DISPUTED, to: MatchState.COMPLETED, requiredRole: "admin" },
  { from: MatchState.AUTO_FORFEIT, to: MatchState.COMPLETED, requiredRole: "admin" },
];

export class MatchStateError extends Error {
  constructor(from: MatchState, to: MatchState, reason?: string) {
    super(`Invalid transition: ${from} → ${to}${reason ? ` (${reason})` : ""}`);
    this.name = "MatchStateError";
  }
}

export function canTransition(from: MatchState, to: MatchState, role?: string): boolean {
  return TRANSITIONS.some(
    (t) =>
      t.from === from &&
      t.to === to &&
      (!t.requiredRole || t.requiredRole === "either" || t.requiredRole === role),
  );
}

export function assertTransition(from: MatchState, to: MatchState, role?: string): void {
  if (!canTransition(from, to, role)) {
    throw new MatchStateError(from, to);
  }
}

export function isActive(state: MatchState): boolean {
  return state === MatchState.ACTIVE;
}

export function isTerminal(state: MatchState): boolean {
  return [MatchState.COMPLETED, MatchState.CANCELLED, MatchState.EXPIRED, MatchState.AUTO_FORFEIT].includes(state);
}

export function canSubmitScore(state: MatchState): boolean {
  return state === MatchState.ACTIVE;
}

export function canVerify(state: MatchState): boolean {
  return state === MatchState.SCORE_SUBMITTED || state === MatchState.PENDING_VERIFICATION;
}

export function displayLabel(state: MatchState): string {
  const labels: Record<MatchState, string> = {
    [MatchState.PENDING_ACCEPTANCE]: "Awaiting Acceptance",
    [MatchState.ACTIVE]: "Match Active",
    [MatchState.SCORE_SUBMITTED]: "Score Submitted",
    [MatchState.PENDING_VERIFICATION]: "Verifying",
    [MatchState.COMPLETED]: "Completed",
    [MatchState.DISPUTED]: "Disputed",
    [MatchState.ADMIN_REVIEW]: "Under Review",
    [MatchState.CANCELLED]: "Cancelled",
    [MatchState.EXPIRED]: "Expired",
    [MatchState.AUTO_FORFEIT]: "Forfeit",
  };
  return labels[state];
}

export function statusColor(state: MatchState): string {
  const colors: Record<MatchState, string> = {
    [MatchState.PENDING_ACCEPTANCE]: "text-gold",
    [MatchState.ACTIVE]: "text-accent",
    [MatchState.SCORE_SUBMITTED]: "text-cyan",
    [MatchState.PENDING_VERIFICATION]: "text-cyan",
    [MatchState.COMPLETED]: "text-emerald",
    [MatchState.DISPUTED]: "text-negative",
    [MatchState.ADMIN_REVIEW]: "text-orange",
    [MatchState.CANCELLED]: "text-muted-soft",
    [MatchState.EXPIRED]: "text-muted-soft",
    [MatchState.AUTO_FORFEIT]: "text-negative/80",
  };
  return colors[state];
}
