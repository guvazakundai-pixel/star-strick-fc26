import { db } from "@/lib/db";
import { calculateXPAndPoints, calculateElo } from "@/lib/xp-engine";
import { recomputePlayerRankings } from "@/lib/ranking";
import { checkAndAward } from "@/lib/achievements";
import { audit } from "@/lib/audit";
import { resolveDispute, applyAiVerdict } from "@/lib/ai-dispute-resolver";
import { sendEmail, renderChallengeEmail } from "@/lib/email";
import { notifyUser } from "@/server/socket";
import { logMatchResult, logChallengeCreated, logActivity } from "@/lib/activity";
import crypto from "crypto";

const CHALLENGE_EXPIRY_HOURS = 48;
const CHALLENGE_CODE_LENGTH = 6;

// ─── Challenge codes ─────────────────────────────────────────

export async function generateChallengeCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < CHALLENGE_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const existing = await db.execute({
    sql: "SELECT id FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  if (existing.rows.length > 0) return generateChallengeCode();
  return code;
}

// ─── Create challenge ────────────────────────────────────────

export async function createChallenge(
  challengerId: string,
  opponentId: string,
  platform?: string,
  gameMode?: string,
  message?: string,
) {
  if (challengerId === opponentId) throw new Error("Cannot challenge yourself");

  // Check bans
  const user = await db.execute({
    sql: "SELECT is_banned, is_shadow_banned FROM users WHERE id = ?",
    args: [challengerId],
  });
  const row = user.rows[0] as Record<string, unknown> | undefined;
  if (row?.is_banned) throw new Error("Your account is suspended");
  if (row?.is_shadow_banned) throw new Error("Your account is restricted");

  // Check duplicate pending challenge
  const pendingCheck = await db.execute({
    sql: `SELECT id FROM challenges WHERE challenger_id = ? AND opponent_id = ? AND status = 'PENDING_ACCEPTANCE'`,
    args: [challengerId, opponentId],
  });
  if (pendingCheck.rows.length > 0) throw new Error("You already have a pending challenge with this player");

  // Daily limit
  const recentMatches = await db.execute({
    sql: `SELECT count(*) as c FROM challenges
          WHERE (challenger_id = ? OR opponent_id = ?)
          AND status IN ('PENDING_ACCEPTANCE', 'MATCH_READY', 'AWAITING_VERIFICATION')
          AND created_at > datetime('now', '-24 hours')`,
    args: [challengerId, challengerId],
  });
  if (Number((recentMatches.rows[0] as Record<string, unknown>)?.c ?? 0) >= 20) {
    throw new Error("You've reached the daily challenge limit (20)");
  }

  const code = await generateChallengeCode();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  await db.execute({
    sql: `INSERT INTO challenges (id, challenge_code, challenger_id, opponent_id, status, platform, game_mode, message, created_at, expires_at)
          VALUES (?, ?, ?, ?, 'PENDING_ACCEPTANCE', ?, ?, ?, ?, ?)`,
    args: [id, code, challengerId, opponentId, platform || null, gameMode || null, message || null, now, expiresAt],
  });

  await audit(challengerId, "CHALLENGE_CREATE", id, { code, opponentId, platform, gameMode });

  // Notify opponent
  const challenger = await db.execute({
    sql: "SELECT username, email FROM users WHERE id = ?",
    args: [challengerId],
  });
  const opponent = await db.execute({
    sql: "SELECT username, email FROM users WHERE id = ?",
    args: [opponentId],
  });

  const challengerName = (challenger.rows[0] as any)?.username ?? "Someone";
  const opponentName = (opponent.rows[0] as any)?.username ?? "Someone";
  const opponentEmail = (opponent.rows[0] as any)?.email;

  // Email notification
  if (opponentEmail) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw";
      const html = renderChallengeEmail({
        challengerName,
        challengeCode: code,
        acceptUrl: `${baseUrl}/challenges/${code}`,
      });
      await sendEmail({
        to: opponentEmail,
        subject: `⚔ ${challengerName} challenged you on ZimFC Pro`,
        html,
      });
    } catch (e) {
      console.error("[challenge] Email failed:", e);
    }
  }

  // Realtime notification
  try {
    notifyUser(opponentId, {
      type: "CHALLENGE",
      title: "New Challenge!",
      message: `${challengerName} has challenged you.`,
      link: `/challenges/${code}`,
    });
  } catch {}

  // DB notification
  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, 'CHALLENGE', 'New Challenge!', ?, ?, ?)`,
      args: [crypto.randomUUID(), opponentId, `${challengerName} has challenged you.`, `/challenges/${code}`, now],
    });
  } catch (e) {
    console.error("[challenge] Notification insert failed:", e);
  }

  await logChallengeCreated(challengerId, opponentId, challengerName, opponentName, code);

  return { id, code, status: "PENDING_ACCEPTANCE" };
}

// ─── Accept challenge ────────────────────────────────────────

export async function acceptChallenge(code: string, userId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "PENDING_ACCEPTANCE") throw new Error("Challenge is no longer pending");
  if (challenge.opponent_id !== userId) throw new Error("Only the challenged player can accept");
  if (challenge.challenger_id === userId) throw new Error("You cannot accept your own challenge");

  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE challenges SET status = 'MATCH_READY', accepted_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(userId, "CHALLENGE_ACCEPT", challenge.id as string, { code });

  // Notify challenger
  try {
    notifyUser(challenge.challenger_id as string, {
      type: "CHALLENGE",
      title: "Challenge Accepted!",
      message: `Your challenge was accepted. Play the match and submit your result.`,
      link: `/challenges/${code}`,
    });
  } catch {}

  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, 'CHALLENGE', 'Challenge Accepted!', ?, ?, ?)`,
      args: [crypto.randomUUID(), challenge.challenger_id, `Your challenge was accepted. Play now!`, `/challenges/${code}`, now],
    });
  } catch {}

  return { id: challenge.id, code, status: "MATCH_READY" };
}

// ─── Reject challenge ────────────────────────────────────────

export async function rejectChallenge(code: string, userId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "PENDING_ACCEPTANCE") throw new Error("Challenge is no longer pending");

  const isParticipant = challenge.opponent_id === userId || challenge.challenger_id === userId;
  if (!isParticipant) throw new Error("Not your challenge");

  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE challenges SET status = 'CANCELLED', resolved_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(userId, "CHALLENGE_REJECT", challenge.id as string, { code });

  // Notify the other player
  try {
    const otherId = challenge.challenger_id === userId ? challenge.opponent_id : challenge.challenger_id;
    notifyUser(otherId as string, {
      type: "CHALLENGE",
      title: "Challenge Declined",
      message: `Your challenge has been declined.`,
      link: `/rankings`,
    });
  } catch {}

  return { id: challenge.id, status: "CANCELLED" };
}

// ─── Submit match result ──────────────────────────────────────

export async function submitResult(
  challengeCode: string,
  submitterId: string,
  challengerScore: number,
  opponentScore: number,
  screenshotUrl?: string,
  notes?: string,
) {
  if (challengerScore < 0 || challengerScore > 20 || opponentScore < 0 || opponentScore > 20) {
    throw new Error("Scores must be between 0 and 20");
  }
  if (challengerScore === 0 && opponentScore === 0) {
    throw new Error("Both scores cannot be 0");
  }

  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [challengeCode],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "MATCH_READY") throw new Error("Challenge is not ready for score submission");

  const isParticipant = challenge.challenger_id === submitterId || challenge.opponent_id === submitterId;
  if (!isParticipant) throw new Error("You are not a participant in this challenge");

  // Prevent duplicate submission
  const existingResult = await db.execute({
    sql: "SELECT id FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });
  if (existingResult.rows.length > 0) throw new Error("A result has already been submitted for this challenge");

  const now = new Date().toISOString();
  const resultId = crypto.randomUUID();

  await db.execute({
    sql: `INSERT INTO match_results (id, challenge_id, submitted_by, challenger_score, opponent_score, screenshot_url, notes, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [resultId, challenge.id, submitterId, challengerScore, opponentScore, screenshotUrl || null, notes || null, now],
  });

  await db.execute({
    sql: `UPDATE challenges SET status = 'AWAITING_VERIFICATION' WHERE id = ?`,
    args: [challenge.id as string],
  });

  await audit(submitterId, "RESULT_SUBMIT", challenge.id as string, { challengerScore, opponentScore, screenshotUrl });

  // Notify the opponent (non-submitter)
  const opponentId = challenge.challenger_id === submitterId ? challenge.opponent_id : challenge.challenger_id;
  const submitter = await db.execute({
    sql: "SELECT username FROM users WHERE id = ?",
    args: [submitterId],
  });
  const submitterName = (submitter.rows[0] as any)?.username ?? "Someone";

  try {
    notifyUser(opponentId as string, {
      type: "MATCH",
      title: "Result Submitted",
      message: `${submitterName} submitted the match result. Verify or dispute it.`,
      link: `/challenges/${challengeCode}`,
    });
  } catch {}

  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, 'MATCH', 'Result Submitted', ?, ?, ?)`,
      args: [crypto.randomUUID(), opponentId, `${submitterName} submitted the result: ${challengerScore}-${opponentScore}. Verify now.`, `/challenges/${challengeCode}`, now],
    });
  } catch {}

  return {
    id: challenge.id,
    status: "AWAITING_VERIFICATION",
    result: { challengerScore, opponentScore, submittedBy: submitterId },
  };
}

// ─── Verify / accept result ──────────────────────────────────

export async function verifyResult(challengeCode: string, verifierId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [challengeCode],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "AWAITING_VERIFICATION") throw new Error("Challenge is not awaiting verification");

  const isParticipant = challenge.challenger_id === verifierId || challenge.opponent_id === verifierId;
  if (!isParticipant) throw new Error("You are not a participant in this challenge");

  // Fetch the match result
  const mr = await db.execute({
    sql: "SELECT * FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });
  const matchResult = mr.rows[0] as Record<string, unknown> | undefined;
  if (!matchResult) throw new Error("No result found");

  // Cannot verify your own submission
  if (matchResult.submitted_by === verifierId) throw new Error("You cannot verify your own result submission");

  const now = new Date().toISOString();

  // Mark as VERIFIED
  await db.execute({
    sql: `UPDATE challenges SET status = 'VERIFIED', resolved_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(verifierId, "RESULT_VERIFY", challenge.id as string, {
    challengerScore: matchResult.challenger_score,
    opponentScore: matchResult.opponent_score,
  });

  // Determine winner/loser
  const challengerId = challenge.challenger_id as string;
  const opponentId = challenge.opponent_id as string;
  const cScore = Number(matchResult.challenger_score);
  const oScore = Number(matchResult.opponent_score);

  let winnerId: string | null = null;
  let loserId: string | null = null;
  let winnerScore: number;
  let loserScore: number;

  if (cScore > oScore) {
    winnerId = challengerId;
    loserId = opponentId;
    winnerScore = cScore;
    loserScore = oScore;
  } else if (oScore > cScore) {
    winnerId = opponentId;
    loserId = challengerId;
    winnerScore = oScore;
    loserScore = cScore;
  }

  // Create MatchReport record
  const reportId = crypto.randomUUID();
  if (winnerId && loserId) {
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', 'VERIFIED', ?, ?)`,
      args: [reportId, challengerId, opponentId, winnerId, cScore, oScore, verifierId, now],
    });

    // Apply stats + rankings
    await applyVerifiedResult(winnerId, loserId, winnerScore, loserScore, challenge.id as string);

    // Notifications
    try {
      notifyUser(winnerId, { type: "MATCH", title: "Victory!", message: `Match verified. You won ${winnerScore}-${loserScore}!`, link: `/challenges/${challengeCode}` });
      notifyUser(loserId, { type: "MATCH", title: "Defeat", message: `Match verified. You lost ${loserScore}-${winnerScore}.`, link: `/challenges/${challengeCode}` });
    } catch {}

    const cName = (await getUsername(challengerId)) || "Challenger";
    const oName = (await getUsername(opponentId)) || "Opponent";
    await logMatchResult(winnerId, loserId, winnerId === challengerId ? cName : oName, winnerId === challengerId ? oName : cName, `${cScore}-${oScore}`, challengeCode);

    return { id: challenge.id, status: "VERIFIED", winnerId, reportId, score: `${cScore}-${oScore}` };
  } else {
    // Draw
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, 'VERIFIED', 'VERIFIED', ?, ?)`,
      args: [reportId, challengerId, opponentId, cScore, oScore, verifierId, now],
    });

    await applyDrawResult(challengerId, opponentId, challenge.id as string);

    try {
      notifyUser(challengerId, { type: "MATCH", title: "Draw!", message: "Match verified as a draw.", link: `/challenges/${challengeCode}` });
      notifyUser(opponentId, { type: "MATCH", title: "Draw!", message: "Match verified as a draw.", link: `/challenges/${challengeCode}` });
    } catch {}

    return { id: challenge.id, status: "VERIFIED", draw: true, reportId, score: `${cScore}-${oScore}` };
  }
}

// ─── Reject result → dispute ─────────────────────────────────

export async function rejectResult(challengeCode: string, rejectorId: string, reason: string) {
  if (!reason || reason.trim().length === 0) throw new Error("A reason is required to dispute a result");

  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [challengeCode],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "AWAITING_VERIFICATION") throw new Error("Challenge is not awaiting verification");

  const isParticipant = challenge.challenger_id === rejectorId || challenge.opponent_id === rejectorId;
  if (!isParticipant) throw new Error("You are not a participant in this challenge");

  // Get the match result
  const mr = await db.execute({
    sql: "SELECT * FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });
  const matchResult = mr.rows[0] as Record<string, unknown> | undefined;
  if (!matchResult) throw new Error("No result found");
  if (matchResult.submitted_by === rejectorId) throw new Error("You cannot dispute your own result submission");

  const now = new Date().toISOString();

  // Update match_result with dispute reason
  await db.execute({
    sql: `UPDATE match_results SET dispute_reason = ? WHERE challenge_id = ?`,
    args: [reason, challenge.id as string],
  });

  // Mark challenge as DISPUTED
  await db.execute({
    sql: `UPDATE challenges SET status = 'DISPUTED', resolved_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(rejectorId, "RESULT_REJECT", challenge.id as string, { reason });

  // ── AI Auto-Resolution ──
  try {
    const aiVerdict = await resolveDispute(
      challenge.id as string,
      challengeCode,
      challenge.challenger_id as string,
      challenge.opponent_id as string,
      {
        submittedBy: matchResult.submitted_by as string,
        challengerScore: Number(matchResult.challenger_score),
        opponentScore: Number(matchResult.opponent_score),
        screenshotUrl: matchResult.screenshot_url as string | null,
        notes: matchResult.notes as string | null,
        submittedAt: matchResult.submitted_at as string,
      },
      null, // no counter-submission for reject
      reason,
      "reject",
    );

    if (aiVerdict.autoApplied) {
      const result = await applyAiVerdict(
        challenge.id as string,
        challengeCode,
        aiVerdict,
        challenge.challenger_id as string,
        challenge.opponent_id as string,
      );

      if (result.aiResolved) {
        // Apply stats + rankings since AI resolved
        const cScore = aiVerdict.finalScore.challengerScore;
        const oScore = aiVerdict.finalScore.opponentScore;
        const winner = cScore > oScore ? challenge.challenger_id : oScore > cScore ? challenge.opponent_id : null;
        const loser = winner === challenge.challenger_id ? challenge.opponent_id : winner === challenge.opponent_id ? challenge.challenger_id : null;

        if (winner && loser) {
          await applyVerifiedResult(winner as string, loser as string, Math.max(cScore, oScore), Math.min(cScore, oScore), challenge.id as string);
        } else {
          await applyDrawResult(challenge.challenger_id as string, challenge.opponent_id as string, challenge.id as string);
        }

        // Notify both players of AI decision
        try {
          notifyUser(rejectorId as string, {
            type: "MATCH",
            title: "AI Referee Resolved",
            message: `Dispute auto-resolved: ${aiVerdict.reasoning.slice(-1)[0]}. Final: ${cScore}-${oScore}`,
            link: `/challenges/${challengeCode}`,
          });
          notifyUser(matchResult.submitted_by as string, {
            type: "MATCH",
            title: "AI Referee Resolved",
            message: `Dispute auto-resolved: ${aiVerdict.reasoning.slice(-1)[0]}. Final: ${cScore}-${oScore}`,
            link: `/challenges/${challengeCode}`,
          });
        } catch {}

        await audit("ai-referee", "AI_RESOLVE", challenge.id as string, {
          decision: aiVerdict.decision,
          confidence: aiVerdict.confidence,
          reasoning: aiVerdict.reasoning,
        });

        return {
          id: challenge.id,
          status: "RESOLVED",
          aiResolved: true,
          aiDecision: aiVerdict.decision,
          aiConfidence: aiVerdict.confidence,
          aiReasoning: aiVerdict.reasoning,
        };
      }
    }

    // AI couldn't resolve — log reasoning and escalate
    console.log(`[AI Referee] Escalated challenge ${challengeCode}: ${aiVerdict.reasoning.join(" | ")}`);
  } catch (e) {
    console.error("[AI Referee] Resolution error:", e instanceof Error ? e.message : String(e));
    console.error("[AI Referee] Stack:", e instanceof Error ? e.stack : "no stack");
    // Fall through — leave as DISPUTED for manual admin review
  }

  // Notify both players (original flow)
  const otherId = challenge.challenger_id === rejectorId ? challenge.opponent_id : challenge.challenger_id;
  try {
    notifyUser(rejectorId as string, { type: "MATCH", title: "Result Rejected", message: "You disputed the result. An admin will review.", link: `/challenges/${challengeCode}` });
    notifyUser(otherId as string, { type: "MATCH", title: "Result Disputed", message: "Your submitted result was disputed. Admin review pending.", link: `/challenges/${challengeCode}` });
  } catch {}

  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at)
            VALUES (?, ?, 'MATCH', 'Match Disputed', ?, ?, ?)`,
      args: [crypto.randomUUID(), otherId, `The match result has been disputed. Reason: ${reason}`, `/challenges/${challengeCode}`, now],
    });
  } catch {}

  return { id: challenge.id, status: "DISPUTED" };
}

// ─── Adjust result → counter-submit ───────────────────────────

export async function adjustResult(
  challengeCode: string,
  adjusterId: string,
  challengerScore: number,
  opponentScore: number,
  screenshotUrl?: string,
  notes?: string,
) {
  if (challengerScore < 0 || challengerScore > 20 || opponentScore < 0 || opponentScore > 20) {
    throw new Error("Scores must be between 0 and 20");
  }

  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [challengeCode],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "AWAITING_VERIFICATION") throw new Error("Challenge is not awaiting verification");

  const isParticipant = challenge.challenger_id === adjusterId || challenge.opponent_id === adjusterId;
  if (!isParticipant) throw new Error("You are not a participant in this challenge");

  const mr = await db.execute({
    sql: "SELECT * FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });
  const matchResult = mr.rows[0] as Record<string, unknown> | undefined;
  if (!matchResult) throw new Error("No result found");
  if (matchResult.submitted_by === adjusterId) throw new Error("You cannot adjust your own result submission");

  const now = new Date().toISOString();

  // Store counter-submission
  await db.execute({
    sql: `UPDATE match_results SET
          counter_submitted_by = ?, counter_challenger_score = ?, counter_opponent_score = ?,
          counter_screenshot_url = ?, counter_notes = ?, counter_submitted_at = ?
          WHERE challenge_id = ?`,
    args: [adjusterId, challengerScore, opponentScore, screenshotUrl || null, notes || null, now, challenge.id as string],
  });

  await db.execute({
    sql: `UPDATE challenges SET status = 'DISPUTED' WHERE id = ?`,
    args: [challenge.id as string],
  });

  await audit(adjusterId, "RESULT_ADJUST", challenge.id as string, {
    originalScore: `${matchResult.challenger_score}-${matchResult.opponent_score}`,
    counterScore: `${challengerScore}-${opponentScore}`,
  });

  // ── AI Auto-Resolution ──
  try {
    const aiVerdict = await resolveDispute(
      challenge.id as string,
      challengeCode,
      challenge.challenger_id as string,
      challenge.opponent_id as string,
      {
        submittedBy: matchResult.submitted_by as string,
        challengerScore: Number(matchResult.challenger_score),
        opponentScore: Number(matchResult.opponent_score),
        screenshotUrl: matchResult.screenshot_url as string | null,
        notes: matchResult.notes as string | null,
        submittedAt: matchResult.submitted_at as string,
      },
      {
        submittedBy: adjusterId,
        challengerScore,
        opponentScore,
        screenshotUrl: screenshotUrl || null,
        notes: notes || null,
        submittedAt: now,
      },
      null,
      "adjust",
    );

    if (aiVerdict.autoApplied) {
      const result = await applyAiVerdict(
        challenge.id as string,
        challengeCode,
        aiVerdict,
        challenge.challenger_id as string,
        challenge.opponent_id as string,
      );

      if (result.aiResolved) {
        const cScore = aiVerdict.finalScore.challengerScore;
        const oScore = aiVerdict.finalScore.opponentScore;
        const winner = cScore > oScore ? challenge.challenger_id : oScore > cScore ? challenge.opponent_id : null;
        const loser = winner === challenge.challenger_id ? challenge.opponent_id : winner === challenge.opponent_id ? challenge.challenger_id : null;

        if (winner && loser) {
          await applyVerifiedResult(winner as string, loser as string, Math.max(cScore, oScore), Math.min(cScore, oScore), challenge.id as string);
        } else {
          await applyDrawResult(challenge.challenger_id as string, challenge.opponent_id as string, challenge.id as string);
        }

        try {
          notifyUser(adjusterId as string, {
            type: "MATCH",
            title: "AI Referee Decision",
            message: `Dispute auto-resolved: ${aiVerdict.reasoning.slice(-1)[0]}. Final: ${cScore}-${oScore}`,
            link: `/challenges/${challengeCode}`,
          });
          notifyUser(matchResult.submitted_by as string, {
            type: "MATCH",
            title: "AI Referee Decision",
            message: `Dispute auto-resolved: ${aiVerdict.reasoning.slice(-1)[0]}. Final: ${cScore}-${oScore}`,
            link: `/challenges/${challengeCode}`,
          });
        } catch {}

        await audit("ai-referee", "AI_RESOLVE", challenge.id as string, {
          decision: aiVerdict.decision,
          confidence: aiVerdict.confidence,
          reasoning: aiVerdict.reasoning,
        });

        return {
          id: challenge.id,
          status: "RESOLVED",
          aiResolved: true,
          aiDecision: aiVerdict.decision,
          aiConfidence: aiVerdict.confidence,
          aiReasoning: aiVerdict.reasoning,
        };
      }
    }

    console.log(`[AI Referee] Escalated adjust on ${challengeCode}: ${aiVerdict.reasoning.join(" | ")}`);
  } catch (e) {
    console.error("[AI Referee] Resolution error on adjust:", e instanceof Error ? e.message : String(e));
    console.error("[AI Referee] Stack:", e instanceof Error ? e.stack : "no stack");
  }

  // Notify both players (original flow for escalated cases)
  const otherId = challenge.challenger_id === adjusterId ? challenge.opponent_id : challenge.challenger_id;
  try {
    notifyUser(otherId as string, { type: "MATCH", title: "Result Adjusted", message: "Your opponent submitted a different score. Admin review pending.", link: `/challenges/${challengeCode}` });
    notifyUser(adjusterId as string, { type: "MATCH", title: "Counter Submitted", message: "Your version has been submitted. An admin will review.", link: `/challenges/${challengeCode}` });
  } catch {}

  return { id: challenge.id, status: "DISPUTED" };
}

// ─── Admin dispute resolution ─────────────────────────────────

export async function adminResolveDispute(
  adminId: string,
  code: string,
  action: "approve_original" | "approve_counter" | "enter_score" | "cancel",
  finalScores?: { challengerScore: number; opponentScore: number },
) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "DISPUTED") throw new Error("Challenge is not disputed");

  const mr = await db.execute({
    sql: "SELECT * FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });
  const matchResult = mr.rows[0] as Record<string, unknown> | undefined;
  if (!matchResult) throw new Error("No match result found");

  const now = new Date().toISOString();

  if (action === "cancel") {
    await db.execute({
      sql: `UPDATE challenges SET status = 'CANCELLED', resolved_at = ? WHERE id = ?`,
      args: [now, challenge.id as string],
    });
    await db.execute({
      sql: `UPDATE match_results SET resolved_by = ?, resolved_at = ? WHERE challenge_id = ?`,
      args: [adminId, now, challenge.id as string],
    });
    await audit(adminId, "DISPUTE_CANCEL", challenge.id as string, { code });
    return { status: "CANCELLED" };
  }

  let finalChallengerScore: number;
  let finalOpponentScore: number;

  if (action === "approve_original") {
    finalChallengerScore = Number(matchResult.challenger_score);
    finalOpponentScore = Number(matchResult.opponent_score);
  } else if (action === "approve_counter") {
    if (matchResult.counter_challenger_score == null || matchResult.counter_opponent_score == null) {
      throw new Error("No counter submission to approve");
    }
    finalChallengerScore = Number(matchResult.counter_challenger_score);
    finalOpponentScore = Number(matchResult.counter_opponent_score);
  } else if (action === "enter_score") {
    if (!finalScores) throw new Error("finalScores required for enter_score action");
    finalChallengerScore = finalScores.challengerScore;
    finalOpponentScore = finalScores.opponentScore;
  } else {
    throw new Error("Invalid action");
  }

  // Store final scores in match_result
  await db.execute({
    sql: `UPDATE match_results SET final_challenger_score = ?, final_opponent_score = ?, resolved_by = ?, resolved_at = ? WHERE challenge_id = ?`,
    args: [finalChallengerScore, finalOpponentScore, adminId, now, challenge.id as string],
  });

  // Resolve challenge
  await db.execute({
    sql: `UPDATE challenges SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(adminId, "DISPUTE_RESOLVE", challenge.id as string, {
    action,
    finalScore: `${finalChallengerScore}-${finalOpponentScore}`,
  });

  // Determine winner/loser and apply stats
  const challengerId = challenge.challenger_id as string;
  const opponentId = challenge.opponent_id as string;
  const cScore = finalChallengerScore;
  const oScore = finalOpponentScore;

  let winnerId: string | null = cScore > oScore ? challengerId : oScore > cScore ? opponentId : null;
  let loserId: string | null = winnerId === challengerId ? opponentId : winnerId === opponentId ? challengerId : null;

  if (winnerId && loserId) {
    const reportId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'RESOLVED', 'RESOLVED', ?, ?)`,
      args: [reportId, challengerId, opponentId, winnerId, cScore, oScore, adminId, now],
    });

    const winScore = Math.max(cScore, oScore);
    const loseScore = Math.min(cScore, oScore);
    await applyVerifiedResult(winnerId, loserId, winScore, loseScore, challenge.id as string);

    try {
      notifyUser(winnerId, { type: "MATCH", title: "Dispute Resolved", message: `Admin resolved: you won ${winScore}-${loseScore}!`, link: `/challenges/${code}` });
      notifyUser(loserId, { type: "MATCH", title: "Dispute Resolved", message: `Admin resolved: you lost ${loseScore}-${winScore}.`, link: `/challenges/${code}` });
    } catch {}
  } else {
    // Draw
    const reportId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, 'RESOLVED', 'RESOLVED', ?, ?)`,
      args: [reportId, challengerId, opponentId, cScore, oScore, adminId, now],
    });
    await applyDrawResult(challengerId, opponentId, challenge.id as string);

    try {
      notifyUser(challengerId, { type: "MATCH", title: "Dispute Resolved", message: `Admin resolved the match as a draw.`, link: `/challenges/${code}` });
      notifyUser(opponentId, { type: "MATCH", title: "Dispute Resolved", message: `Admin resolved the match as a draw.`, link: `/challenges/${code}` });
    } catch {}
  }

  return { status: "RESOLVED", winnerId, finalScore: `${cScore}-${oScore}` };
}

// ─── Helper: apply verified match result (stats + rankings) ──

async function applyVerifiedResult(
  winnerId: string,
  loserId: string,
  winnerScore: number,
  loserScore: number,
  challengeId: string,
) {
  const now = new Date().toISOString();

  // Fetch current stats
  const wStats = await db.execute({
    sql: "SELECT skill_rating, win_streak, points, matches_played FROM player_stats WHERE user_id = ?",
    args: [winnerId],
  });
  const lStats = await db.execute({
    sql: "SELECT skill_rating, win_streak, points, matches_played FROM player_stats WHERE user_id = ?",
    args: [loserId],
  });

  const wRow = wStats.rows[0] as Record<string, unknown>;
  const lRow = lStats.rows[0] as Record<string, unknown>;
  const wRating = Number(wRow?.skill_rating ?? 1000);
  const lRating = Number(lRow?.skill_rating ?? 1000);
  const wStreak = Number(wRow?.win_streak ?? 0);
  const wPoints = Number(wRow?.points ?? 0);
  const lPoints = Number(lRow?.points ?? 0);
  const wMatches = Number(wRow?.matches_played ?? 0);
  const lMatches = Number(lRow?.matches_played ?? 0);

  const xp = calculateXPAndPoints(wRating, lRating, winnerScore, loserScore, winnerId, loserId, wStreak, wPoints, lPoints, wMatches, lMatches);

  // Winner stats — upsert
  const wExisting = await db.execute({ sql: "SELECT user_id FROM player_stats WHERE user_id = ?", args: [winnerId] });
  if (wExisting.rows.length > 0) {
    await db.execute({
      sql: `UPDATE player_stats SET wins = wins + 1, matches_played = matches_played + 1, goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?, skill_rating = ?, points = points + ?, win_streak = win_streak + 1, form_score = form_score + 10 WHERE user_id = ?`,
      args: [winnerScore, loserScore, xp.winnerNewRating, xp.winnerPointsGain, winnerId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO player_stats (id, user_id, wins, matches_played, goals_scored, goals_conceded, skill_rating, points, win_streak, form_score, form_history, updated_at) VALUES (?, ?, 1, 1, ?, ?, ?, ?, 1, 10, 'W', ?)`,
      args: [crypto.randomUUID(), winnerId, winnerScore, loserScore, xp.winnerNewRating, xp.winnerPointsGain, now],
    });
  }
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('W' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [winnerId],
  });

  // Loser stats — upsert
  const lExisting = await db.execute({ sql: "SELECT user_id FROM player_stats WHERE user_id = ?", args: [loserId] });
  if (lExisting.rows.length > 0) {
    await db.execute({
      sql: `UPDATE player_stats SET losses = losses + 1, matches_played = matches_played + 1, goals_scored = goals_scored + ?, goals_conceded = goals_conceded + ?, skill_rating = ?, points = points + ?, win_streak = 0, form_score = form_score - 5 WHERE user_id = ?`,
      args: [loserScore, winnerScore, xp.loserNewRating, Math.round(xp.loserPointsGain), loserId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO player_stats (id, user_id, losses, matches_played, goals_scored, goals_conceded, skill_rating, points, win_streak, form_score, form_history, updated_at) VALUES (?, ?, 1, 1, ?, ?, ?, ?, 0, -5, 'L', ?)`,
      args: [crypto.randomUUID(), loserId, loserScore, winnerScore, xp.loserNewRating, Math.round(xp.loserPointsGain), now],
    });
  }
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('L' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [loserId],
  });

  // Points logs
  await db.execute({
    sql: `INSERT INTO points_log (id, user_id, points_change, reason, reason_text, match_id, created_at) VALUES (?, ?, ?, 'CHALLENGE_WIN', ?, ?, ?)`,
    args: [crypto.randomUUID(), winnerId, xp.winnerPointsGain, xp.description, challengeId, now],
  });
  await db.execute({
    sql: `INSERT INTO points_log (id, user_id, points_change, reason, reason_text, match_id, created_at) VALUES (?, ?, ?, 'CHALLENGE_LOSS', ?, ?, ?)`,
    args: [crypto.randomUUID(), loserId, Math.round(xp.loserXPLoss), xp.description, challengeId, now],
  });

  // Recompute rankings
  await recomputePlayerRankings();

  // Check achievements
  try {
    await checkAndAward(winnerId, { isWin: true });
    await checkAndAward(loserId, { isWin: false });
  } catch {}
}

// ─── Helper: apply draw result ────────────────────────────────

async function applyDrawResult(player1Id: string, player2Id: string, challengeId: string) {
  const now = new Date().toISOString();
  const drawPoints = 25;

  for (const pid of [player1Id, player2Id]) {
    const ex = await db.execute({ sql: "SELECT user_id FROM player_stats WHERE user_id = ?", args: [pid] });
    if (ex.rows.length > 0) {
      await db.execute({
        sql: `UPDATE player_stats SET draws = draws + 1, matches_played = matches_played + 1, points = points + ? WHERE user_id = ?`,
        args: [drawPoints, pid],
      });
    } else {
      await db.execute({
        sql: `INSERT INTO player_stats (id, user_id, draws, matches_played, points, form_history, updated_at) VALUES (?, ?, 1, 1, ?, 'D', ?)`,
        args: [crypto.randomUUID(), pid, drawPoints, now],
      });
    }
    await db.execute({
      sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
      args: [pid],
    });
    await db.execute({
      sql: `INSERT INTO points_log (id, user_id, points_change, reason, match_id, created_at) VALUES (?, ?, ?, 'CHALLENGE_DRAW', ?, ?)`,
      args: [crypto.randomUUID(), pid, drawPoints, challengeId, now],
    });
  }

  await recomputePlayerRankings();

  try {
    await checkAndAward(player1Id, { isWin: false });
    await checkAndAward(player2Id, { isWin: false });
  } catch {}
}

// ─── Helper: get username ─────────────────────────────────────

async function getUsername(userId: string): Promise<string | null> {
  const r = await db.execute({ sql: "SELECT username FROM users WHERE id = ?", args: [userId] });
  return (r.rows[0] as any)?.username ?? null;
}

// ─── Query functions ──────────────────────────────────────────

export async function getChallengeByCode(code: string) {
  const result = await db.execute({
    sql: `SELECT c.*,
          u1.username AS challenger_username, u1.display_name AS challenger_display, u1.avatar_url AS challenger_avatar,
          u2.username AS opponent_username, u2.display_name AS opponent_display, u2.avatar_url AS opponent_avatar,
          pr1.rank_position AS challenger_rank, pr1.points AS challenger_points,
          pr2.rank_position AS opponent_rank, pr2.points AS opponent_points
          FROM challenges c
          LEFT JOIN users u1 ON u1.id = c.challenger_id
          LEFT JOIN users u2 ON u2.id = c.opponent_id
          LEFT JOIN player_rankings pr1 ON pr1.user_id = c.challenger_id
          LEFT JOIN player_rankings pr2 ON pr2.user_id = c.opponent_id
          WHERE c.challenge_code = ?`,
    args: [code],
  });

  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) return null;

  // Fetch match result if any
  const mr = await db.execute({
    sql: "SELECT * FROM match_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });

  // Also fetch old challenge_results for backward compatibility
  const cr = await db.execute({
    sql: "SELECT * FROM challenge_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });

  return { ...challenge, matchResult: mr.rows[0] || null, results: cr.rows };
}

export async function getChallengesForUser(userId: string) {
  const result = await db.execute({
    sql: `SELECT c.*,
          u1.username AS challenger_username, u1.display_name AS challenger_display, u1.avatar_url AS challenger_avatar,
          u2.username AS opponent_username, u2.display_name AS opponent_display, u2.avatar_url AS opponent_avatar
          FROM challenges c
          LEFT JOIN users u1 ON u1.id = c.challenger_id
          LEFT JOIN users u2 ON u2.id = c.opponent_id
          WHERE (c.challenger_id = ? OR c.opponent_id = ?)
          ORDER BY
            CASE c.status
              WHEN 'PENDING_ACCEPTANCE' THEN 1
              WHEN 'MATCH_READY' THEN 2
              WHEN 'AWAITING_VERIFICATION' THEN 3
              ELSE 4
            END,
            c.created_at DESC
          LIMIT 50`,
    args: [userId, userId],
  });
  return result.rows;
}

export async function getDisputedChallenges() {
  const result = await db.execute({
    sql: `SELECT c.*,
          u1.username AS challenger_username, u1.display_name AS challenger_display,
          u2.username AS opponent_username, u2.display_name AS opponent_display,
          mr.challenger_score, mr.opponent_score,
          mr.counter_challenger_score, mr.counter_opponent_score,
          mr.dispute_reason, mr.screenshot_url, mr.counter_screenshot_url,
          mr.submitted_by, mr.submitted_at
          FROM challenges c
          LEFT JOIN users u1 ON u1.id = c.challenger_id
          LEFT JOIN users u2 ON u2.id = c.opponent_id
          LEFT JOIN match_results mr ON mr.challenge_id = c.id
          WHERE c.status IN ('DISPUTED', 'ADMIN_REVIEW')
          ORDER BY c.created_at DESC`,
    args: [],
  });
  return result.rows;
}

// ─── Backward-compatible aliases ─────────────────────────────
// Old API routes use these names

export const declineChallenge = rejectChallenge;

export async function submitChallengeScore(code: string, playerId: string, goalsFor: number, goalsAgainst: number) {
  // Legacy wrapper — uses the old dual-submission flow
  // Just delegates to submitResult for the new single-submission flow
  return submitResult(code, playerId, goalsFor, goalsAgainst);
}

// ─── Expiry cron ──────────────────────────────────────────────

export async function expireChallenges() {
  const now = new Date().toISOString();
  const result = await db.execute({
    sql: `UPDATE challenges SET status = 'EXPIRED', resolved_at = ? WHERE status IN ('PENDING_ACCEPTANCE', 'MATCH_READY') AND expires_at IS NOT NULL AND expires_at < ?`,
    args: [now, now],
  });
  const fallback = await db.execute({
    sql: `UPDATE challenges SET status = 'EXPIRED', resolved_at = ? WHERE status IN ('PENDING_ACCEPTANCE', 'MATCH_READY') AND (expires_at IS NULL OR expires_at = '') AND datetime(created_at) < datetime(?, '-48 hours')`,
    args: [now, now],
  });
  return { expired: (result.rowsAffected ?? 0) + (fallback.rowsAffected ?? 0) };
}
