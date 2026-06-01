/**
 * AI Dispute Resolver — automated match referee
 *
 * When a match result is disputed (rejected or adjusted), this engine
 * analyzes both submissions and automatically resolves the dispute
 * when confidence is high. Only genuinely ambiguous cases escalate
 * to human admin review.
 *
 * No external API calls — pure rules engine with statistical heuristics.
 */

import { db } from "@/lib/db";
import crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────

interface Submission {
  submittedBy: string;
  challengerScore: number;
  opponentScore: number;
  screenshotUrl: string | null;
  notes: string | null;
  submittedAt: string;
}

interface PlayerProfile {
  id: string;
  totalMatches: number;
  disputesFiled: number;
  disputesLost: number;
  reportAccuracy: number; // 0-100: how often their reports match opponent's
  winRate: number;
  avgGoalsScored: number;
  avgGoalsConceded: number;
}

interface DisputeCase {
  challengeId: string;
  challengeCode: string;
  challengerId: string;
  opponentId: string;
  original: Submission;
  counter: Submission | null; // null if rejected (not adjusted)
  disputeReason: string | null;
  disputeType: "reject" | "adjust";
}

export interface AiVerdict {
  decision: "ACCEPT_ORIGINAL" | "ACCEPT_COUNTER" | "ACCEPT_AVERAGE" | "ESCALATE" | "FORFEIT_ORIGINAL" | "FORFEIT_COUNTER";
  confidence: number; // 0-100
  reasoning: string[];
  finalScore: { challengerScore: number; opponentScore: number };
  autoApplied: boolean;
}

// ─── Profile scoring ─────────────────────────────────────────

async function getPlayerProfile(userId: string): Promise<PlayerProfile> {
  // Get stats
  const stats = await db.execute({
    sql: `SELECT matches_played, wins, losses, goals_scored, goals_conceded
          FROM player_stats WHERE user_id = ?`,
    args: [userId],
  });
  const s = stats.rows[0] as Record<string, unknown> | undefined;

  const totalMatches = Number(s?.matches_played ?? 0);
  const wins = Number(s?.wins ?? 0);
  const goalsScored = Number(s?.goals_scored ?? 0);
  const goalsConceded = Number(s?.goals_conceded ?? 0);

  // Count disputes this user has filed
  const disputesRes = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM match_results
          WHERE (submitted_by = ? OR counter_submitted_by = ?)
          AND dispute_reason IS NOT NULL`,
    args: [userId, userId],
  });
  const disputesFiled = Number((disputesRes.rows[0] as any)?.cnt ?? 0);

  // Count disputes where their submission was NOT the final one (they "lost" the dispute)
  const disputesLost = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM match_results mr
          JOIN challenges ch ON ch.id = mr.challenge_id
          WHERE ch.status = 'RESOLVED'
          AND (
            (mr.submitted_by = ? AND mr.final_challenger_score IS NOT NULL AND mr.final_challenger_score <> mr.challenger_score)
            OR
            (mr.counter_submitted_by = ? AND mr.final_challenger_score IS NOT NULL AND mr.final_challenger_score <> mr.counter_challenger_score)
          )`,
    args: [userId, userId],
  });

  const disputesLostCount = Number((disputesLost.rows[0] as any)?.cnt ?? 0);

  // Report accuracy: matches where they submitted and it matched opponent / got verified
  const accurateRes = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM match_results mr
          JOIN challenges ch ON ch.id = mr.challenge_id
          WHERE mr.submitted_by = ? AND ch.status IN ('VERIFIED', 'RESOLVED')
          AND NOT EXISTS (SELECT 1 FROM match_results mr2 WHERE mr2.challenge_id = mr.challenge_id AND mr2.counter_submitted_by IS NOT NULL)`,
    args: [userId],
  });
  const accurateReports = Number((accurateRes.rows[0] as any)?.cnt ?? 0);

  const reportAccuracy = totalMatches > 0
    ? Math.round((accurateReports / Math.max(totalMatches, 1)) * 100)
    : 50; // Default 50% for new players

  return {
    id: userId,
    totalMatches,
    disputesFiled,
    disputesLost: disputesLostCount,
    reportAccuracy: Math.min(100, Math.max(0, reportAccuracy)),
    winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 50,
    avgGoalsScored: totalMatches > 0 ? Math.round((goalsScored / totalMatches) * 10) / 10 : 2.0,
    avgGoalsConceded: totalMatches > 0 ? Math.round((goalsConceded / totalMatches) * 10) / 10 : 2.0,
  };
}

// ─── Core analysis ────────────────────────────────────────────

function analyzeScorePlausibility(score: { challengerScore: number; opponentScore: number }): {
  plausible: boolean;
  flags: string[];
} {
  const flags: string[] = [];
  const { challengerScore: cs, opponentScore: os } = score;

  // Impossible scorelines
  if (cs === 0 && os === 0) flags.push("Double zero score");
  if (cs > 15 || os > 15) flags.push("Unusually high score (>15)");
  if (cs > 20 || os > 20) flags.push("Score exceeds max (20)");

  // Suspicious patterns
  if (cs === os && cs > 5) flags.push("High-scoring draw — unusual in FC");
  if (cs === 0 && os > 5) flags.push("One-sided — possible rage quit");
  if (os === 0 && cs > 5) flags.push("One-sided — possible rage quit");

  // Both scores are 0-0 or 1-0 patterns - these are very common
  const isValid = cs >= 0 && cs <= 20 && os >= 0 && os <= 20 && !(cs === 0 && os === 0);

  return { plausible: isValid && flags.length === 0, flags };
}

function scoreSimilarity(
  a: { challengerScore: number; opponentScore: number },
  b: { challengerScore: number; opponentScore: number },
): { identical: boolean; close: boolean; goalDiff: number; winnerSame: boolean } {
  const aDiff = a.challengerScore - a.opponentScore;
  const bDiff = b.challengerScore - b.opponentScore;

  const identical = a.challengerScore === b.challengerScore && a.opponentScore === b.opponentScore;
  const goalDiff = Math.abs(a.challengerScore - b.challengerScore) + Math.abs(a.opponentScore - b.opponentScore);
  const close = goalDiff <= 2; // Within 2 total goals difference
  const winnerSame = (aDiff > 0 && bDiff > 0) || (aDiff < 0 && bDiff < 0) || (aDiff === 0 && bDiff === 0);

  return { identical, close, goalDiff, winnerSame };
}

// ─── Main AI resolver ─────────────────────────────────────────

export async function resolveDispute(
  challengeId: string,
  challengeCode: string,
  challengerId: string,
  opponentId: string,
  original: Submission,
  counter: Submission | null,
  disputeReason: string | null,
  disputeType: "reject" | "adjust",
): Promise<AiVerdict> {
  const reasoning: string[] = [];

  // ── 1. Fetch player profiles ──
  const [challengerProfile, opponentProfile] = await Promise.all([
    getPlayerProfile(challengerId),
    getPlayerProfile(opponentId),
  ]);

  const submitterProfile = original.submittedBy === challengerId ? challengerProfile : opponentProfile;
  const otherProfile = original.submittedBy === challengerId ? opponentProfile : challengerProfile;

  reasoning.push(`Original submitted by player with ${submitterProfile.reportAccuracy}% report accuracy`);
  reasoning.push(`Dispute type: ${disputeType}${disputeReason ? ` — "${disputeReason}"` : ""}`);

  // ── 2. Check score plausibility ──
  const originalPlausibility = analyzeScorePlausibility({
    challengerScore: original.challengerScore,
    opponentScore: original.opponentScore,
  });

  if (!originalPlausibility.plausible) {
    reasoning.push(`⚠ Original score flagged: ${originalPlausibility.flags.join(", ")}`);
  }

  let counterPlausibility = { plausible: true, flags: [] as string[] };
  if (counter) {
    counterPlausibility = analyzeScorePlausibility({
      challengerScore: counter.challengerScore,
      opponentScore: counter.opponentScore,
    });
    if (!counterPlausibility.plausible) {
      reasoning.push(`⚠ Counter score flagged: ${counterPlausibility.flags.join(", ")}`);
    }
  }

  // ── 3. Score similarity analysis ──
  if (counter) {
    const similarity = scoreSimilarity(
      { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
      { challengerScore: counter.challengerScore, opponentScore: counter.opponentScore },
    );

    reasoning.push(`Score comparison: Original ${original.challengerScore}-${original.opponentScore} vs Counter ${counter.challengerScore}-${counter.opponentScore}`);

    // CASE 1: Identical scores — both agree, just verifying
    if (similarity.identical) {
      reasoning.push("✅ Scores are identical — both players agree");
      return {
        decision: "ACCEPT_ORIGINAL",
        confidence: 100,
        reasoning,
        finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
        autoApplied: true,
      };
    }

    // CASE 2: Very close scores (within 1 goal total difference) + same winner
    if (similarity.close && similarity.winnerSame) {
      reasoning.push(`✅ Scores are very close (${similarity.goalDiff} goal difference) with same winner`);

      // If one has screenshot and other doesn't, trust screenshot
      if (original.screenshotUrl && !counter.screenshotUrl) {
        reasoning.push("📷 Original has screenshot evidence, counter does not");
        return {
          decision: "ACCEPT_ORIGINAL",
          confidence: 90,
          reasoning,
          finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
          autoApplied: true,
        };
      }
      if (counter.screenshotUrl && !original.screenshotUrl) {
        reasoning.push("📷 Counter has screenshot evidence, original does not");
        return {
          decision: "ACCEPT_COUNTER",
          confidence: 90,
          reasoning,
          finalScore: { challengerScore: counter.challengerScore, opponentScore: counter.opponentScore },
          autoApplied: true,
        };
      }

      // Otherwise, average the scores (round to nearest integer)
      const avgChallenger = Math.round((original.challengerScore + counter.challengerScore) / 2);
      const avgOpponent = Math.round((original.opponentScore + counter.opponentScore) / 2);
      reasoning.push(`📊 Averaging scores: ${avgChallenger}-${avgOpponent}`);
      return {
        decision: "ACCEPT_AVERAGE",
        confidence: 85,
        reasoning,
        finalScore: { challengerScore: avgChallenger, opponentScore: avgOpponent },
        autoApplied: true,
      };
    }

    // CASE 3: Different winners — one side is clearly wrong
    if (!similarity.winnerSame) {
      reasoning.push("⚠ Players disagree on who won");

      // Trust the player with higher report accuracy
      const submitterWins = original.challengerScore > original.opponentScore;
      const counterWins = counter.challengerScore > counter.opponentScore;

      // If submitter has much higher accuracy AND screenshot, trust original
      if (submitterProfile.reportAccuracy >= 80 && original.screenshotUrl) {
        reasoning.push(`📷 Submitter has ${submitterProfile.reportAccuracy}% accuracy + screenshot → trusting original`);
        return {
          decision: "ACCEPT_ORIGINAL",
          confidence: 75,
          reasoning,
          finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
          autoApplied: true,
        };
      }

      // If other player has much higher accuracy + screenshot, trust counter
      if (otherProfile.reportAccuracy >= 80 && counter?.screenshotUrl) {
        reasoning.push(`📷 Counter-submitter has ${otherProfile.reportAccuracy}% accuracy + screenshot → trusting counter`);
        return {
          decision: "ACCEPT_COUNTER",
          confidence: 75,
          reasoning,
          finalScore: { challengerScore: counter.challengerScore, opponentScore: counter.opponentScore },
          autoApplied: true,
        };
      }

      // Escalate — cannot reliably determine winner
      reasoning.push("🔄 Different winners + insufficient evidence → escalating to admin");
      return {
        decision: "ESCALATE",
        confidence: 40,
        reasoning,
        finalScore: { challengerScore: 0, opponentScore: 0 },
        autoApplied: false,
      };
    }
  }

  // ── 4. Reject-only analysis (no counter-submission) ──
  if (disputeType === "reject" && !counter) {
    reasoning.push("No counter-submission — analyzing original score alone");

    // If original is plausible AND submitter has good history, auto-accept
    if (originalPlausibility.plausible && submitterProfile.reportAccuracy >= 70) {
      reasoning.push(`✅ Original score is plausible (${submitterProfile.reportAccuracy}% reporter accuracy) → auto-accepting`);
      return {
        decision: "ACCEPT_ORIGINAL",
        confidence: 70,
        reasoning,
        finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
        autoApplied: true,
      };
    }

    // If the disputer has a history of filing disputes, trust original more
    if (otherProfile.disputesFiled >= 3 && otherProfile.disputesLost >= 2) {
      reasoning.push(`⚠ Disputer has filed ${otherProfile.disputesFiled} disputes, lost ${otherProfile.disputesLost} — likely frivolous`);
      return {
        decision: "ACCEPT_ORIGINAL",
        confidence: 80,
        reasoning,
        finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
        autoApplied: true,
      };
    }

    // Check for rage-quit forfeit pattern (3-0)
    if (original.challengerScore === 3 && original.opponentScore === 0) {
      reasoning.push("⚡ 3-0 score detected — common forfeit/rage-quit result → auto-accepting");
      return {
        decision: "FORFEIT_ORIGINAL",
        confidence: 85,
        reasoning,
        finalScore: { challengerScore: 3, opponentScore: 0 },
        autoApplied: true,
      };
    }
    if (original.opponentScore === 3 && original.challengerScore === 0) {
      reasoning.push("⚡ 0-3 score detected — common forfeit/rage-quit result → auto-accepting");
      return {
        decision: "FORFEIT_ORIGINAL",
        confidence: 85,
        reasoning,
        finalScore: { challengerScore: 0, opponentScore: 3 },
        autoApplied: true,
      };
    }

    // If original has screenshot + plausible score + decent reporter, auto-accept
    if (original.screenshotUrl && originalPlausibility.plausible && submitterProfile.reportAccuracy >= 50) {
      reasoning.push("📷 Screenshot evidence + plausible score → auto-accepting");
      return {
        decision: "ACCEPT_ORIGINAL",
        confidence: 75,
        reasoning,
        finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
        autoApplied: true,
      };
    }
  }

  // ── 5. Reputation-based resolution ──
  const accuracyGap = submitterProfile.reportAccuracy - otherProfile.reportAccuracy;

  if (accuracyGap >= 30 && originalPlausibility.plausible) {
    reasoning.push(`⚖ Submitter accuracy ${submitterProfile.reportAccuracy}% vs ${otherProfile.reportAccuracy}% (gap: ${accuracyGap}%) → trusting submitter`);
    return {
      decision: "ACCEPT_ORIGINAL",
      confidence: 75,
      reasoning,
      finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
      autoApplied: true,
    };
  }

  if (accuracyGap <= -30 && counter && counterPlausibility.plausible) {
    reasoning.push(`⚖ Counter-submitter accuracy ${otherProfile.reportAccuracy}% vs ${submitterProfile.reportAccuracy}% (gap: ${-accuracyGap}%) → trusting counter`);
    return {
      decision: "ACCEPT_COUNTER",
      confidence: 75,
      reasoning,
      finalScore: { challengerScore: counter.challengerScore, opponentScore: counter.opponentScore },
      autoApplied: true,
    };
  }

  // ── 6. Historical scoring pattern check ──
  if (originalPlausibility.plausible) {
    const submitterAvgGoals = submitterProfile.avgGoalsScored;
    const submitterAvgConceded = submitterProfile.avgGoalsConceded;
    const origGoalDiff = Math.abs(original.challengerScore - submitterAvgGoals) + Math.abs(original.opponentScore - submitterAvgConceded);

    if (origGoalDiff <= 2 && submitterProfile.totalMatches >= 5) {
      reasoning.push(`📈 Score matches submitter's historical pattern (avg ${submitterAvgGoals} scored, ${submitterAvgConceded} conceded) → accepting`);
      return {
        decision: "ACCEPT_ORIGINAL",
        confidence: 78,
        reasoning,
        finalScore: { challengerScore: original.challengerScore, opponentScore: original.opponentScore },
        autoApplied: true,
      };
    }
  }

  // ── 7. Default: escalate to admin ──
  reasoning.push("🔍 Insufficient evidence for automated resolution — escalating to admin review");
  return {
    decision: "ESCALATE",
    confidence: 35,
    reasoning,
    finalScore: { challengerScore: 0, opponentScore: 0 },
    autoApplied: false,
  };
}

// ─── Apply AI verdict to database ─────────────────────────────

export async function applyAiVerdict(
  challengeId: string,
  challengeCode: string,
  verdict: AiVerdict,
  challengerId: string,
  opponentId: string,
): Promise<{ status: string; aiResolved: boolean }> {
  if (!verdict.autoApplied || verdict.decision === "ESCALATE") {
    // Leave as DISPUTED for admin
    return { status: "DISPUTED", aiResolved: false };
  }

  const now = new Date().toISOString();
  const { challengerScore, opponentScore } = verdict.finalScore;

  // Get the original submitter's ID for the match report FK
  const mrRow = await db.execute({
    sql: "SELECT submitted_by FROM match_results WHERE challenge_id = ?",
    args: [challengeId],
  });
  const submittedById = (mrRow.rows[0] as any)?.submitted_by || challengerId;

  // Update match_result with AI decision
  await db.execute({
    sql: `UPDATE match_results SET
          final_challenger_score = ?, final_opponent_score = ?,
          resolved_by = 'ai-referee', resolved_at = ?,
          dispute_reason = COALESCE(dispute_reason, '') || ' [AI resolved: ' || ? || ']'
          WHERE challenge_id = ?`,
    args: [challengerScore, opponentScore, now, verdict.decision, challengeId],
  });

  // Update challenge status
  await db.execute({
    sql: `UPDATE challenges SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`,
    args: [now, challengeId],
  });

  // Create match report
  const cScore = challengerScore;
  const oScore = opponentScore;
  let winnerId: string | null = cScore > oScore ? challengerId : oScore > cScore ? opponentId : null;
  let loserId: string | null = winnerId === challengerId ? opponentId : winnerId === opponentId ? challengerId : null;

  const reportId = crypto.randomUUID();
  if (winnerId && loserId) {
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'RESOLVED', 'RESOLVED', ?, ?)`,
      args: [reportId, challengerId, opponentId, winnerId, cScore, oScore, submittedById, now],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, 'RESOLVED', 'RESOLVED', ?, ?)`,
      args: [reportId, challengerId, opponentId, cScore, oScore, submittedById, now],
    });
  }

  return {
    status: "RESOLVED",
    aiResolved: true,
  };
}
