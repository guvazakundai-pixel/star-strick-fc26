import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export interface AntiCheatVerdict {
  passed: boolean;
  score: number;
  flags: string[];
  confidence: number;
}

const WIN_TRADING_SCORE_THRESHOLD = 0.9;
const FARMING_MATCH_LIMIT = 5;
const FARMING_WINDOW_MS = 24 * 60 * 60 * 1000;
const SMURF_WINRATE_THRESHOLD = 0.85;
const SMURF_MATCH_MIN = 10;
const RAGE_QUIT_PENALTY_THRESHOLD = 3;
const MAX_SCORE_PER_SIDE = 50;
const MIN_MATCH_DURATION_MS = 120_000;
const MAX_MATCH_DURATION_MS = 7_200_000;

export async function analyzeMatchScores(
  player1Score: number,
  player2Score: number,
  player1Id: string,
  player2Id: string,
  screenshots: string[],
  rageQuit: boolean,
): Promise<AntiCheatVerdict> {
  const flags: string[] = [];
  let confidence = 0;

  if (player1Score > MAX_SCORE_PER_SIDE || player2Score > MAX_SCORE_PER_SIDE) {
    flags.push("IMPLAUSIBLE_SCORE");
    confidence += 40;
  }

  if (player1Score === 0 && player2Score === 0) {
    flags.push("ZERO_ZERO_SCORE");
    confidence += 15;
  }

  const totalGoals = player1Score + player2Score;
  if (totalGoals > 30) {
    flags.push("EXCESSIVE_GOALS");
    confidence += 20;
  }

  if (rageQuit) {
    flags.push("RAGE_QUIT");
    confidence += 10;
  }

  if (screenshots.length === 0) {
    flags.push("NO_SCREENSHOT_PROOF");
    confidence += 15;
  }

  const pairChecks = await checkDuplicateOpponents(player1Id, player2Id);

  if (pairChecks) {
    flags.push(pairChecks.flag);
    confidence += pairChecks.confidence;
  }

  const frequency = await checkMatchFrequency(player1Id, player2Id);
  if (frequency) {
    flags.push(frequency.flag);
    confidence += frequency.confidence;
  }

  const winTrade = await checkWinTrading(player1Id, player2Id);
  if (winTrade) {
    flags.push(winTrade.flag);
    confidence += winTrade.confidence;
  }

  const smurfCheck = await checkSmurfing(player1Id);
  if (smurfCheck) {
    flags.push(smurfCheck.flag);
    confidence += smurfCheck.confidence;
  }

  return {
    passed: confidence < 60,
    score: Math.min(confidence, 100),
    flags,
    confidence: Math.min(confidence, 100),
  };
}

async function checkDuplicateOpponents(
  aId: string,
  bId: string,
): Promise<{ flag: string; confidence: number } | null> {
  const recent = await db.execute({
    sql: `SELECT count(*) as c FROM match_reports 
         WHERE status_raw IN ('COMPLETED','CONFIRMED','APPROVED')
         AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
         AND created_at > datetime('now', '-7 days')`,
    args: [aId, bId, bId, aId],
  });

  const count = Number((recent.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (count >= FARMING_MATCH_LIMIT) {
    return { flag: "DUPLICATE_OPPONENT_FARMING", confidence: 30 };
  }
  return null;
}

async function checkMatchFrequency(
  aId: string,
  bId: string,
): Promise<{ flag: string; confidence: number } | null> {
  const recent = await db.execute({
    sql: `SELECT created_at FROM match_reports 
         WHERE status_raw IN ('COMPLETED','CONFIRMED','APPROVED')
         AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
         ORDER BY created_at DESC LIMIT 2`,
    args: [aId, bId, bId, aId],
  });

  if (recent.rows.length < 2) return null;

  const t1 = new Date((recent.rows[0] as Record<string, unknown>).created_at as string).getTime();
  const t2 = new Date((recent.rows[1] as Record<string, unknown>).created_at as string).getTime();

  if (t1 - t2 < FARMING_WINDOW_MS && recent.rows.length >= FARMING_MATCH_LIMIT) {
    return { flag: "HIGH_FREQUENCY_MATCHES", confidence: 30 };
  }
  return null;
}

async function checkWinTrading(
  aId: string,
  bId: string,
): Promise<{ flag: string; confidence: number } | null> {
  const recent = await db.execute({
    sql: `SELECT winner_id, count(*) as c FROM match_reports 
         WHERE status_raw = 'APPROVED'
         AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
         GROUP BY winner_id`,
    args: [aId, bId, bId, aId],
  });

  if (recent.rows.length < 2) return null;

  const rows = recent.rows as Record<string, unknown>[];
  const total = rows.reduce((s, r) => s + Number(r.c), 0);
  const alternating = rows.every((r) => Number(r.c) <= Math.ceil(total * WIN_TRADING_SCORE_THRESHOLD));

  if (alternating && total >= 4) {
    return { flag: "SUSPECTED_WIN_TRADING", confidence: 45 };
  }
  return null;
}

async function checkSmurfing(playerId: string): Promise<{ flag: string; confidence: number } | null> {
  const stats = await prisma.playerStats.findUnique({ where: { userId: playerId } });
  if (!stats || stats.matchesPlayed < SMURF_MATCH_MIN) return null;

  const winRate = stats.matchesPlayed > 0 ? stats.wins / stats.matchesPlayed : 0;
  if (winRate >= SMURF_WINRATE_THRESHOLD && stats.skillRating < 1200) {
    return { flag: "SUSPECTED_SMURF", confidence: 35 };
  }
  return null;
}

export async function computeReputationScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isShadowBanned: true, isBanned: true },
  });

  if (user?.isBanned) return 0;
  if (user?.isShadowBanned) return 200;

  const stats = await prisma.playerStats.findUnique({ where: { userId } });
  if (!stats || stats.matchesPlayed === 0) return 500;

  let score = 500;
  const winRate = stats.wins / stats.matchesPlayed;

  if (winRate > 0.6) score += 50;
  else if (winRate < 0.2) score -= 50;

  if (stats.winStreak > 5) score += 30;
  if (stats.matchesPlayed > 100) score += 40;

  const rageQuits = await db.execute({
    sql: `SELECT count(*) as c FROM match_reports 
         WHERE (player1_id = ? OR player2_id = ?) 
         AND status_raw IN ('AUTO_FORFEIT','FORFEIT')
         AND created_at > datetime('now', '-30 days')`,
    args: [userId, userId],
  });

  const rq = Number((rageQuits.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (rq >= RAGE_QUIT_PENALTY_THRESHOLD) {
    score -= rq * 30;
  }

  const disputes = await db.execute({
    sql: `SELECT count(*) as c FROM match_reports 
         WHERE (player1_id = ? OR player2_id = ?) AND is_disputed = 1
         AND created_at > datetime('now', '-30 days')`,
    args: [userId, userId],
  });

  const d = Number((disputes.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (d > 2) score -= d * 20;

  return Math.max(0, Math.min(1000, score));
}
