import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { calculateXPAndPoints, calculateElo } from "@/lib/xp-engine";
import { recomputePlayerRankings } from "@/lib/ranking";
import { checkAndAward } from "@/lib/achievements";
import { audit } from "@/lib/audit";
import { sendEmail, renderChallengeEmail } from "@/lib/email";
import { notifyUser } from "@/server/socket";
import crypto from "crypto";

const CHALLENGE_EXPIRY_HOURS = 48;
const CHALLENGE_CODE_LENGTH = 6;

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

export async function createChallenge(challengerId: string, opponentId: string) {
  if (challengerId === opponentId) throw new Error("Cannot challenge yourself");

  const user = await db.execute({
    sql: "SELECT is_banned, is_shadow_banned FROM users WHERE id = ?",
    args: [challengerId],
  });
  const row = user.rows[0] as Record<string, unknown> | undefined;
  if (row?.is_banned) throw new Error("Your account is suspended");
  if (row?.is_shadow_banned) throw new Error("Your account is restricted");

  const pendingCheck = await db.execute({
    sql: `SELECT id FROM challenges WHERE challenger_id = ? AND opponent_id = ? AND status = 'pending'`,
    args: [challengerId, opponentId],
  });
  if (pendingCheck.rows.length > 0) throw new Error("You already have a pending challenge with this player");

  const recentMatches = await db.execute({
    sql: `SELECT count(*) as c FROM challenges WHERE (challenger_id = ? OR opponent_id = ?) AND status IN ('pending', 'accepted') AND created_at > datetime('now', '-24 hours')`,
    args: [challengerId, challengerId],
  });
  if (Number((recentMatches.rows[0] as Record<string, unknown>)?.c ?? 0) >= 20) {
    throw new Error("You've reached the daily challenge limit (20)");
  }

  const code = await generateChallengeCode();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO challenges (id, challenge_code, challenger_id, opponent_id, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [id, code, challengerId, opponentId, now],
  });

  await audit(challengerId, "CHALLENGE_CREATE", id, { code, opponentId });

  const challenger = await db.execute({
    sql: "SELECT username, email FROM users WHERE id = ?",
    args: [challengerId],
  });
  const opponent = await db.execute({
    sql: "SELECT username, email FROM users WHERE id = ?",
    args: [opponentId],
  });

  const challengerName = (challenger.rows[0] as any)?.username ?? "Someone";
  const opponentEmail = (opponent.rows[0] as any)?.email;

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

  try {
    notifyUser(opponentId, {
      type: "CHALLENGE",
      title: "New Challenge!",
      message: `${challengerName} has challenged you.`,
      link: `/challenges/${code}`,
    });
  } catch {}

  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at) VALUES (?, ?, 'CHALLENGE', 'New Challenge!', ?, ?, ?)`,
      args: [crypto.randomUUID(), opponentId, `${challengerName} has challenged you.`, `/challenges/${code}`, now],
    });
  } catch (e) {
    console.error("[challenge] Notification insert failed:", e);
  }

  return { id, code, status: "pending" };
}

export async function acceptChallenge(code: string, userId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "pending") throw new Error("Challenge is no longer pending");
  if (challenge.opponent_id !== userId && challenge.challenger_id !== userId) {
    if (challenge.opponent_id !== userId) throw new Error("This challenge is not for you");
  }
  if (challenge.challenger_id === userId) throw new Error("You cannot accept your own challenge");

  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE challenges SET status = 'accepted', accepted_at = ? WHERE id = ?`,
    args: [now, challenge.id as string],
  });

  await audit(userId, "CHALLENGE_ACCEPT", challenge.id as string, { code });

  try {
    notifyUser(challenge.challenger_id as string, {
      type: "CHALLENGE",
      title: "Challenge Accepted!",
      message: `Your challenge has been accepted. The battle begins!`,
      link: `/challenges/${code}`,
    });
  } catch {}

  try {
    await db.execute({
      sql: `INSERT INTO notifications_v2 (id, user_id, type, title, message, link, created_at) VALUES (?, ?, 'CHALLENGE', 'Challenge Accepted!', ?, ?, ?)`,
      args: [crypto.randomUUID(), challenge.challenger_id, `Your challenge was accepted.`, `/challenges/${code}`, now],
    });
  } catch {}

  return { id: challenge.id, code, status: "accepted" };
}

export async function declineChallenge(code: string, userId: string) {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "pending") throw new Error("Challenge is no longer pending");

  const isParticipant = challenge.opponent_id === userId || challenge.challenger_id === userId;
  if (!isParticipant) throw new Error("Not your challenge");

  await db.execute({
    sql: `UPDATE challenges SET status = 'cancelled' WHERE id = ?`,
    args: [challenge.id as string],
  });

  await audit(userId, "CHALLENGE_DECLINE", challenge.id as string, { code });

  try {
    const otherId = challenge.challenger_id === userId ? challenge.opponent_id : challenge.challenger_id;
    notifyUser(otherId as string, {
      type: "CHALLENGE",
      title: "Challenge Declined",
      message: `A challenge has been declined.`,
      link: `/rankings`,
    });
  } catch {}

  return { id: challenge.id, status: "cancelled" };
}

export async function submitChallengeScore(code: string, playerId: string, goalsFor: number, goalsAgainst: number) {
  if (goalsFor < 0 || goalsFor > 20 || goalsAgainst < 0 || goalsAgainst > 20) {
    throw new Error("Scores must be between 0 and 20");
  }
  if (goalsFor === goalsAgainst && goalsFor === 0) {
    throw new Error("Both scores cannot be 0 for a valid submission");
  }

  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "accepted") throw new Error("Challenge must be accepted before submitting scores");
  if (challenge.challenger_id !== playerId && challenge.opponent_id !== playerId) {
    throw new Error("You are not a participant in this challenge");
  }

  const existing = await db.execute({
    sql: "SELECT id FROM challenge_results WHERE challenge_id = ? AND player_id = ?",
    args: [challenge.id as string, playerId],
  });
  if (existing.rows.length > 0) throw new Error("You have already submitted your score");

  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO challenge_results (id, challenge_id, player_id, goals_for, goals_against, submitted_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [crypto.randomUUID(), challenge.id, playerId, goalsFor, goalsAgainst, now],
  });

  await audit(playerId, "CHALLENGE_SCORE_SUBMIT", challenge.id as string, { goalsFor, goalsAgainst });

  const bothResults = await db.execute({
    sql: "SELECT * FROM challenge_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });

  const opponentId = challenge.challenger_id === playerId ? challenge.opponent_id : challenge.challenger_id;

  if (bothResults.rows.length === 2) {
    const p1 = bothResults.rows.find((r: any) => r.player_id === challenge.challenger_id) as Record<string, unknown>;
    const p2 = bothResults.rows.find((r: any) => r.player_id === challenge.opponent_id) as Record<string, unknown>;

    if (p1 && p2) {
      const p1Goals = Number(p1.goals_for);
      const p2Goals = Number(p2.goals_for);

      if (
        (p1.goals_for === p2.goals_against && p2.goals_for === p1.goals_against)
      ) {
        return await autoVerifyChallenge(challenge, p1, p2);
      } else {
        await db.execute({
          sql: `UPDATE challenges SET status = 'disputed', resolved_at = ? WHERE id = ?`,
          args: [now, challenge.id],
        });

        await audit("0", "CHALLENGE_DISPUTE", challenge.id as string, {
          p1Score: `${p1.goals_for}-${p1.goals_against}`,
          p2Score: `${p2.goals_for}-${p2.goals_against}`,
        });

        try {
          notifyUser(challenge.challenger_id as string, {
            type: "MATCH",
            title: "Score Mismatch",
            message: "There is a score disagreement. Under admin review.",
            link: `/challenges/${code}`,
          });
          notifyUser(challenge.opponent_id as string, {
            type: "MATCH",
            title: "Score Mismatch",
            message: "There is a score disagreement. Under admin review.",
            link: `/challenges/${code}`,
          });
        } catch {}

        return { id: challenge.id, status: "disputed", message: "Scores don't match — under admin review" };
      }
    }
  }

  try {
    notifyUser(opponentId as string, {
      type: "MATCH",
      title: "Score Submitted",
      message: "Your opponent submitted their score. Submit yours to complete the match.",
      link: `/challenges/${code}`,
    });
  } catch {}

  return { id: challenge.id, status: "accepted", message: "Score submitted. Waiting for opponent." };
}

async function autoVerifyChallenge(
  challenge: Record<string, unknown>,
  p1Result: Record<string, unknown>,
  p2Result: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const challengerId = challenge.challenger_id as string;
  const opponentId = challenge.opponent_id as string;
  const challengerGoals = Number(p1Result.goals_for);
  const opponentGoals = Number(p2Result.goals_for);

  await db.execute({
    sql: `UPDATE challenges SET status = 'completed', resolved_at = ? WHERE id = ?`,
    args: [now, challenge.id],
  });

  const matchId = challenge.id as string;

  const winnerId = challengerGoals > opponentGoals ? challengerId : opponentGoals > challengerGoals ? opponentId : null;
  const loserId = winnerId === challengerId ? opponentId : winnerId === opponentId ? challengerId : null;

  let matchReportId: string | null = null;

  if (winnerId) {
    const reportId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', 'COMPLETED', ?, ?)`,
      args: [reportId, challengerId, opponentId, winnerId, challengerGoals, opponentGoals, challengerId, now],
    });
    matchReportId = reportId;

    const winnerScore = Math.max(challengerGoals, opponentGoals);
    const loserScore = Math.min(challengerGoals, opponentGoals);

    const winnerStats = await db.execute({
      sql: "SELECT skill_rating, win_streak, points, matches_played FROM player_stats WHERE user_id = ?",
      args: [winnerId],
    });
    const loserStats = await db.execute({
      sql: "SELECT skill_rating, win_streak, points, matches_played FROM player_stats WHERE user_id = ?",
      args: [loserId!],
    });

    const wRow = winnerStats.rows[0] as Record<string, unknown>;
    const lRow = loserStats.rows[0] as Record<string, unknown>;
    const wRating = Number(wRow?.skill_rating ?? 1000);
    const lRating = Number(lRow?.skill_rating ?? 1000);
    const wStreak = Number(wRow?.win_streak ?? 0);
    const wPoints = Number(wRow?.points ?? 0);
    const lPoints = Number(lRow?.points ?? 0);
    const wMatches = Number(wRow?.matches_played ?? 0);
    const lMatches = Number(lRow?.matches_played ?? 0);

    const xp = calculateXPAndPoints(wRating, lRating, winnerScore, loserScore, winnerId, loserId!, wStreak, wPoints, lPoints, wMatches, lMatches);

    await prisma.playerStats.upsert({
      where: { userId: winnerId },
      create: { userId: winnerId, wins: 1, matchesPlayed: 1, goalsScored: winnerScore, goalsConceded: loserScore, skillRating: xp.winnerNewRating, points: xp.winnerPointsGain, winStreak: 1, formScore: 10, formHistory: "W" },
      update: { wins: { increment: 1 }, matchesPlayed: { increment: 1 }, goalsScored: { increment: winnerScore }, goalsConceded: { increment: loserScore }, skillRating: xp.winnerNewRating, points: { increment: xp.winnerPointsGain }, winStreak: { increment: 1 }, formScore: { increment: 10 } },
    });

    await db.execute({
      sql: `UPDATE player_stats SET form_history = substr(('W' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
      args: [winnerId],
    });

    await prisma.playerStats.upsert({
      where: { userId: loserId! },
      create: { userId: loserId!, losses: 1, matchesPlayed: 1, goalsScored: loserScore, goalsConceded: winnerScore, skillRating: xp.loserNewRating, points: Math.round(xp.loserPointsGain), winStreak: 0, formScore: -5, formHistory: "L" },
      update: { losses: { increment: 1 }, matchesPlayed: { increment: 1 }, goalsScored: { increment: loserScore }, goalsConceded: { increment: winnerScore }, skillRating: xp.loserNewRating, points: { increment: Math.round(xp.loserPointsGain) }, winStreak: { set: 0 }, formScore: { increment: -5 } },
    });

    await db.execute({
      sql: `UPDATE player_stats SET form_history = substr(('L' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
      args: [loserId],
    });

    await prisma.pointsLog.create({ data: { userId: winnerId, pointsChange: xp.winnerPointsGain, reason: "CHALLENGE_WIN", reasonText: xp.description } });
    await prisma.pointsLog.create({ data: { userId: loserId!, pointsChange: Math.round(xp.loserXPLoss), reason: "CHALLENGE_LOSS", reasonText: xp.description } });

    await recomputePlayerRankings();

    try {
      checkAndAward(winnerId, { isWin: true });
      checkAndAward(loserId!, { isWin: false });
    } catch {}

    try {
      notifyUser(winnerId, { type: "MATCH", title: "Victory!", message: xp.description, link: `/challenges/${challenge.challenge_code}` });
      notifyUser(loserId!, { type: "MATCH", title: "Defeat", message: xp.description, link: `/challenges/${challenge.challenge_code}` });
    } catch {}
  } else {
    const reportId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, 'COMPLETED', 'COMPLETED', ?, ?)`,
      args: [reportId, challengerId, opponentId, challengerGoals, opponentGoals, challengerId, now],
    });
    matchReportId = reportId;

    const drawPoints = 25;
    await prisma.playerStats.update({ where: { userId: challengerId }, data: { draws: { increment: 1 }, matchesPlayed: { increment: 1 }, points: { increment: drawPoints } } });
    await prisma.playerStats.update({ where: { userId: opponentId }, data: { draws: { increment: 1 }, matchesPlayed: { increment: 1 }, points: { increment: drawPoints } } });
    await db.execute({ sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`, args: [challengerId] });
    await db.execute({ sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`, args: [opponentId] });
    await prisma.pointsLog.create({ data: { userId: challengerId, pointsChange: drawPoints, reason: "CHALLENGE_DRAW" } });
    await prisma.pointsLog.create({ data: { userId: opponentId, pointsChange: drawPoints, reason: "CHALLENGE_DRAW" } });
    await recomputePlayerRankings();

    try {
      notifyUser(challengerId, { type: "MATCH", title: "Draw!", message: "Match ended in a draw. +25 points each.", link: `/challenges/${challenge.challenge_code}` });
      notifyUser(opponentId, { type: "MATCH", title: "Draw!", message: "Match ended in a draw. +25 points each.", link: `/challenges/${challenge.challenge_code}` });
    } catch {}
  }

  await audit("0", "CHALLENGE_COMPLETE", challenge.id as string, {
    winnerId,
    challengerGoals,
    opponentGoals,
    matchReportId,
  });

  return { id: challenge.id, status: "completed", winnerId, matchReportId };
}

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

  const results = await db.execute({
    sql: "SELECT * FROM challenge_results WHERE challenge_id = ?",
    args: [challenge.id as string],
  });

  return { ...challenge, results: results.rows };
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
          AND c.status IN ('pending', 'accepted')
          ORDER BY c.created_at DESC
          LIMIT 20`,
    args: [userId, userId],
  });
  return result.rows;
}

export async function getDisputedChallenges() {
  const result = await db.execute({
    sql: `SELECT c.*,
          u1.username AS challenger_username, u1.display_name AS challenger_display,
          u2.username AS opponent_username, u2.display_name AS opponent_display,
          cr1.goals_for AS challenger_goals, cr1.goals_against AS challenger_conceded,
          cr2.goals_for AS opponent_goals, cr2.goals_against AS opponent_conceded
          FROM challenges c
          LEFT JOIN users u1 ON u1.id = c.challenger_id
          LEFT JOIN users u2 ON u2.id = c.opponent_id
          LEFT JOIN challenge_results cr1 ON cr1.challenge_id = c.id AND cr1.player_id = c.challenger_id
          LEFT JOIN challenge_results cr2 ON cr2.challenge_id = c.id AND cr2.player_id = c.opponent_id
          WHERE c.status = 'disputed'
          ORDER BY c.created_at DESC`,
    args: [],
  });
  return result.rows;
}

export async function adminResolveDispute(adminId: string, code: string, action: "approve_challenger" | "approve_opponent" | "enter_score" | "cancel") {
  const result = await db.execute({
    sql: "SELECT * FROM challenges WHERE challenge_code = ?",
    args: [code],
  });
  const challenge = result.rows[0] as Record<string, unknown> | undefined;
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.status !== "disputed") throw new Error("Challenge is not disputed");

  const now = new Date().toISOString();

  if (action === "cancel") {
    await db.execute({
      sql: `UPDATE challenges SET status = 'cancelled', resolved_at = ? WHERE id = ?`,
      args: [now, challenge.id as string],
    });
    await audit(adminId, "CHALLENGE_ADMIN_CANCEL", challenge.id as string, { code });
    return { status: "cancelled" };
  }

  let winnerId: string | null = null;
  let loserId: string | null = null;
  let winnerScore: number = 0;
  let loserScore: number = 0;

  const challengerId = challenge.challenger_id as string;
  const opponentId = challenge.opponent_id as string;

  if (action === "approve_challenger") {
    const results = await db.execute({
      sql: "SELECT * FROM challenge_results WHERE challenge_id = ? AND player_id = ?",
      args: [challenge.id as string, challengerId],
    });
    const r = results.rows[0] as Record<string, unknown>;
    winnerId = challengerId;
    loserId = opponentId;
    winnerScore = Number(r?.goals_for ?? 0);
    loserScore = Number(r?.goals_against ?? 0);
  } else if (action === "approve_opponent") {
    const results = await db.execute({
      sql: "SELECT * FROM challenge_results WHERE challenge_id = ? AND player_id = ?",
      args: [challenge.id as string, opponentId],
    });
    const r = results.rows[0] as Record<string, unknown>;
    winnerId = opponentId;
    loserId = challengerId;
    winnerScore = Number(r?.goals_for ?? 0);
    loserScore = Number(r?.goals_against ?? 0);
  }

  if (winnerId && loserId) {
    await db.execute({
      sql: `UPDATE challenges SET status = 'completed', resolved_at = ? WHERE id = ?`,
      args: [now, challenge.id],
    });

    const reportId = crypto.randomUUID();
    await db.execute({
      sql: `INSERT INTO match_reports (id, player1_id, player2_id, winner_id, score1, score2, status, status_raw, submitted_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', 'COMPLETED', ?, ?)`,
      args: [reportId, challengerId, opponentId, winnerId, winnerScore, loserScore, adminId, now],
    });

    const winnerStats = await db.execute({ sql: "SELECT skill_rating, win_streak, points, matches_played FROM player_stats WHERE user_id = ?", args: [winnerId] });
    const loserStats = await db.execute({ sql: "SELECT skill_rating, points, matches_played FROM player_stats WHERE user_id = ?", args: [loserId] });
    const wRow = winnerStats.rows[0] as Record<string, unknown>;
    const lRow = loserStats.rows[0] as Record<string, unknown>;
    const wRating = Number(wRow?.skill_rating ?? 1000);
    const lRating = Number(lRow?.skill_rating ?? 1000);
    const wStreak = Number(wRow?.win_streak ?? 0);
    const wPoints = Number(wRow?.points ?? 0);
    const lPoints = Number(lRow?.points ?? 0);
    const wMatches = Number(wRow?.matches_played ?? 0);
    const lMatches = Number(lRow?.matches_played ?? 0);

    const xp = calculateXPAndPoints(wRating, lRating, winnerScore, loserScore, winnerId, loserId, wStreak, wPoints, lPoints, wMatches, lMatches);

    await prisma.playerStats.upsert({
      where: { userId: winnerId },
      create: { userId: winnerId, wins: 1, matchesPlayed: 1, goalsScored: winnerScore, goalsConceded: loserScore, skillRating: xp.winnerNewRating, points: xp.winnerPointsGain, winStreak: 1, formScore: 10, formHistory: "W" },
      update: { wins: { increment: 1 }, matchesPlayed: { increment: 1 }, goalsScored: { increment: winnerScore }, goalsConceded: { increment: loserScore }, skillRating: xp.winnerNewRating, points: { increment: xp.winnerPointsGain }, winStreak: { increment: 1 }, formScore: { increment: 10 } },
    });
    await db.execute({ sql: `UPDATE player_stats SET form_history = substr(('W' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`, args: [winnerId] });

    await prisma.playerStats.upsert({
      where: { userId: loserId },
      create: { userId: loserId, losses: 1, matchesPlayed: 1, goalsScored: loserScore, goalsConceded: winnerScore, skillRating: xp.loserNewRating, points: Math.round(xp.loserPointsGain), formScore: -5, formHistory: "L" },
      update: { losses: { increment: 1 }, matchesPlayed: { increment: 1 }, goalsScored: { increment: loserScore }, goalsConceded: { increment: winnerScore }, skillRating: xp.loserNewRating, points: { increment: Math.round(xp.loserPointsGain) }, winStreak: { set: 0 }, formScore: { increment: -5 } },
    });
    await db.execute({ sql: `UPDATE player_stats SET form_history = substr(('L' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`, args: [loserId] });

    await prisma.pointsLog.create({ data: { userId: winnerId, pointsChange: xp.winnerPointsGain, reason: "CHALLENGE_WIN", reasonText: xp.description } });
    await prisma.pointsLog.create({ data: { userId: loserId, pointsChange: Math.round(xp.loserXPLoss), reason: "CHALLENGE_LOSS", reasonText: xp.description } });

    await recomputePlayerRankings();
  }

  await audit(adminId, "CHALLENGE_ADMIN_RESOLVE", challenge.id as string, { action, winnerId, loserId });
  return { status: "completed", winnerId };
}

export async function expireChallenges() {
  const cutoff = new Date(Date.now() - CHALLENGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
  const result = await db.execute({
    sql: `UPDATE challenges SET status = 'expired', resolved_at = ? WHERE status = 'pending' AND created_at < ?`,
    args: [new Date().toISOString(), cutoff],
  });
  return { expired: result.rowsAffected ?? 0 };
}