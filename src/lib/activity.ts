import { db } from "./db";
import crypto from "crypto";

export async function logActivity(
  type: string,
  userId: string,
  message: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.execute({
      sql: `INSERT INTO user_activities (id, user_id, type, message, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        userId,
        type,
        message,
        metadata ? JSON.stringify(metadata) : null,
        new Date().toISOString(),
      ],
    });
  } catch {
    // Non-critical — don't break match flow if activity log fails
  }
}

export async function logMatchResult(
  winnerId: string | null,
  loserId: string | null,
  winnerName: string,
  loserName: string,
  score: string,
  challengeCode?: string,
) {
  const link = challengeCode ? `/challenges/${challengeCode}` : undefined;

  if (winnerId) {
    await logActivity("MATCH_WON", winnerId, `Defeated ${loserName} ${score}`, {
      opponentId: loserId,
      score,
      challengeCode,
    });
  }
  if (loserId) {
    await logActivity("MATCH_LOST", loserId, `Lost to ${winnerName} ${score}`, {
      opponentId: winnerId,
      score,
      challengeCode,
    });
  }
}

export async function logChallengeCreated(
  challengerId: string,
  opponentId: string,
  challengerName: string,
  opponentName: string,
  challengeCode: string,
) {
  await logActivity("CHALLENGE_CREATED", challengerId, `Challenged ${opponentName}`, {
    opponentId,
    challengeCode,
  });
  await logActivity("CHALLENGE_RECEIVED", opponentId, `Received challenge from ${challengerName}`, {
    opponentId: challengerId,
    challengeCode,
  });
}

export async function logRankChange(userId: string, oldRank: number, newRank: number) {
  if (oldRank === newRank) return;
  const direction = newRank < oldRank ? "up" : "down";
  const message =
    direction === "up"
      ? `Moved up to Rank #${newRank}`
      : `Moved down to Rank #${newRank}`;
  await logActivity("RANK_CHANGED", userId, message, { oldRank, newRank, direction });
}