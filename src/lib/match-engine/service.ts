import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { calculateXPAndPoints } from "@/lib/xp-engine";
import { checkAndAward } from "@/lib/achievements";
import { recomputePlayerRankings } from "@/lib/ranking";
import { audit } from "@/lib/audit";
import {
  MatchState,
  type ScoreSubmission,
  type AntiCheatMetadata,
} from "./types";
import {
  assertTransition,
  canTransition,
  isTerminal,
} from "./state-machine";
import { analyzeMatchScores, computeReputationScore } from "./anti-cheat";
import { createChallengeToken, getChallengeToken, markTokenUsed, shareUrls } from "./challenge-token";
import {
  notifyChallengeReceived,
  notifyChallengeAccepted,
  notifyScoreSubmitted,
  notifyMatchCompleted,
  notifyDisputeOpened,
  notifyDisputeResolved,
} from "./notifications";

export interface CreateChallengeParams {
  challengerId: string;
  opponentId: string | null;
  matchType: string;
  platform: string;
  region: string;
  wagerAmount: number;
}

export interface SubmitScoreParams {
  matchId: string;
  playerId: string;
  score: number;
  opponentScore: number;
  screenshots: string[];
  videoUrl?: string;
  rageQuit: boolean;
  antiCheat: AntiCheatMetadata;
}

export interface VerifyScoreParams {
  matchId: string;
  playerId: string;
  confirm: boolean;
  disputeReason?: string;
}

export async function createChallenge(params: CreateChallengeParams): Promise<{ matchRequestId: string; shareToken: string; shareUrls: ReturnType<typeof shareUrls> }> {
  const token = await createChallengeToken(params);

  const matchRequest = await prisma.matchRequest.create({
    data: {
      senderId: params.challengerId,
      receiverId: params.opponentId ?? "",
      status: "PENDING",
      statusRaw: MatchState.PENDING_ACCEPTANCE,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  if (params.opponentId) {
    const opponent = await prisma.user.findUnique({ where: { id: params.opponentId }, select: { username: true } });
    const challenger = await prisma.user.findUnique({ where: { id: params.challengerId }, select: { username: true } });
    await notifyChallengeReceived(params.opponentId, challenger?.username ?? "Someone", token);
  }

  return {
    matchRequestId: matchRequest.id,
    shareToken: token,
    shareUrls: shareUrls(token),
  };
}

export async function acceptChallenge(token: string, userId: string): Promise<{ matchId: string }> {
  const tokenData = await getChallengeToken(token);
  if (!tokenData) throw new Error("Challenge link is invalid or expired");
  if (tokenData.used) throw new Error("Challenge link has already been used");
  if (new Date(tokenData.expiresAt) < new Date()) throw new Error("Challenge link has expired");

  const match = await prisma.matchReport.create({
    data: {
      player1Id: tokenData.challengerId,
      player2Id: userId,
      status: MatchState.ACTIVE,
      statusRaw: MatchState.ACTIVE,
      submittedById: tokenData.challengerId,
    },
  });

  await markTokenUsed(token);

  const matchReq = await prisma.matchRequest.findFirst({
    where: { senderId: tokenData.challengerId, receiverId: userId, statusRaw: MatchState.PENDING_ACCEPTANCE },
    orderBy: { createdAt: "desc" },
  });
  if (matchReq) {
    await prisma.matchRequest.update({
      where: { id: matchReq.id },
      data: { status: "ACCEPTED", statusRaw: MatchState.ACTIVE },
    });
  }

  await notifyChallengeAccepted(tokenData.challengerId, userId, match.id);

  await audit("0", "MATCH_REQUEST_ACCEPT", match.id, { token, message: "Challenge accepted via link" });

  return { matchId: match.id };
}

export async function submitScore(params: SubmitScoreParams): Promise<{ match: any; antiCheat: any }> {
  const match = await prisma.matchReport.findUnique({ where: { id: params.matchId } });
  if (!match) throw new Error("Match not found");

  assertTransition(match.statusRaw as MatchState, MatchState.SCORE_SUBMITTED, params.playerId === match.player1Id ? "challenger" : "opponent");

  const currentSubmissions = (match.confirmations as any) ?? {};

  const submission: ScoreSubmission = {
    playerId: params.playerId,
    score: params.score,
    opponentScore: params.opponentScore,
    screenshots: params.screenshots,
    videoUrl: params.videoUrl,
    rageQuit: params.rageQuit,
    submittedAt: new Date(),
  };

  const key = params.playerId === match.player1Id ? "player1" : "player2";
  currentSubmissions[key] = submission;

  await prisma.matchReport.update({
    where: { id: params.matchId },
    data: {
      status: MatchState.SCORE_SUBMITTED as any,
      statusRaw: MatchState.SCORE_SUBMITTED,
      confirmations: currentSubmissions,
    },
  });

  const antiCheatVerdict = await analyzeMatchScores(
    params.score,
    params.opponentScore,
    match.player1Id,
    match.player2Id,
    params.screenshots,
    params.rageQuit,
  );

  const opponentId = params.playerId === match.player1Id ? match.player2Id : match.player1Id;
  const opponent = await prisma.user.findUnique({ where: { id: opponentId }, select: { username: true } });
  await notifyScoreSubmitted(opponentId, opponent?.username ?? "Someone", params.matchId);

  await audit("0", "MATCH_CONFIRM", params.matchId, { submittedBy: params.playerId, antiCheat: antiCheatVerdict });

  return { match, antiCheat: antiCheatVerdict };
}

export async function verifyScore(params: VerifyScoreParams): Promise<{ match: any; xpResult?: any }> {
  const match = await prisma.matchReport.findUnique({
    where: { id: params.matchId },
    include: { player1: true, player2: true },
  });
  if (!match) throw new Error("Match not found");

  assertTransition(match.statusRaw as MatchState, MatchState.PENDING_VERIFICATION);

  if (params.confirm) {
    await prisma.matchReport.update({
      where: { id: params.matchId },
      data: {
        status: MatchState.COMPLETED as any,
        statusRaw: MatchState.COMPLETED,
      },
    });

    const submissions = (match.confirmations as any) ?? {};
    const p1Sub = submissions.player1 as ScoreSubmission | undefined;
    const p2Sub = submissions.player2 as ScoreSubmission | undefined;

    const p1Score = p1Sub?.score ?? 0;
    const p2Score = p2Sub?.score ?? 0;

    if (p1Score !== p2Score) {
      const winnerId = p1Score > p2Score ? match.player1Id : match.player2Id;
      const loserId = p1Score > p2Score ? match.player2Id : match.player1Id;
      const winnerScore = Math.max(p1Score, p2Score);
      const loserScore = Math.min(p1Score, p2Score);

      await prisma.matchReport.update({
        where: { id: params.matchId },
        data: { winnerId },
      });

      const xpResult = await applyMatchResults(match.id, winnerId, loserId, winnerScore, loserScore);

      await notifyMatchCompleted(winnerId, "won", params.matchId);
      await notifyMatchCompleted(loserId, "lost", params.matchId);

      await audit("0", "MATCH_CONFIRM", match.id, { result: `${winnerScore}-${loserScore}`, xp: xpResult });

      return { match: await prisma.matchReport.findUnique({ where: { id: params.matchId } }), xpResult };
    } else {
      const xpResult = await applyDraw(match.id, match.player1Id, match.player2Id);

      await notifyMatchCompleted(match.player1Id, "draw", params.matchId);
      await notifyMatchCompleted(match.player2Id, "draw", params.matchId);

      return { match: await prisma.matchReport.findUnique({ where: { id: params.matchId } }), xpResult };
    }
  } else {
    await prisma.matchReport.update({
      where: { id: params.matchId },
      data: {
        status: MatchState.DISPUTED as any,
        statusRaw: MatchState.DISPUTED,
        isDisputed: true,
        notes: params.disputeReason ?? "Score disputed",
      },
    });

    await notifyDisputeOpened(match.player1Id, params.matchId);
    await notifyDisputeOpened(match.player2Id, params.matchId);

    await audit("0", "MATCH_CONFIRM", match.id, { disputed: true, reason: params.disputeReason });

    await prisma.dispute.create({
      data: {
        matchId: params.matchId,
        reportedById: params.playerId,
        reason: params.disputeReason ?? "Score dispute",
        status: "OPEN",
      },
    });

    return { match: await prisma.matchReport.findUnique({ where: { id: params.matchId } }) };
  }
}

async function applyMatchResults(
  matchId: string,
  winnerId: string,
  loserId: string,
  winnerScore: number,
  loserScore: number,
) {
  const winnerStats = await prisma.playerStats.findUnique({ where: { userId: winnerId } });
  const loserStats = await prisma.playerStats.findUnique({ where: { userId: loserId } });

  const winnerRating = winnerStats?.skillRating ?? 1000;
  const loserRating = loserStats?.skillRating ?? 1000;
  const winnerStreak = winnerStats?.winStreak ?? 0;
  const winnerPoints = winnerStats?.points ?? 0;
  const loserPoints = loserStats?.points ?? 0;
  const winnerMatches = winnerStats?.matchesPlayed ?? 0;
  const loserMatches = loserStats?.matchesPlayed ?? 0;

  const xp = calculateXPAndPoints(
    winnerRating, loserRating,
    winnerScore, loserScore,
    winnerId, loserId,
    winnerStreak, winnerPoints, loserPoints,
    winnerMatches, loserMatches,
  );

  await prisma.playerStats.upsert({
    where: { userId: winnerId },
    create: {
      userId: winnerId,
      wins: 1,
      matchesPlayed: 1,
      goalsScored: winnerScore,
      goalsConceded: loserScore,
      skillRating: xp.winnerNewRating,
      points: xp.winnerPointsGain,
      winStreak: winnerStreak + 1,
      formScore: 10,
      formHistory: "W",
    },
    update: {
      wins: { increment: 1 },
      matchesPlayed: { increment: 1 },
      goalsScored: { increment: winnerScore },
      goalsConceded: { increment: loserScore },
      skillRating: xp.winnerNewRating,
      points: { increment: xp.winnerPointsGain },
      winStreak: { increment: 1 },
      formScore: { increment: 10 },
      formHistory: {
        set: prisma.$raw`substr(('W' || coalesce(form_history,'')), 1, 10)`,
      },
    },
  });

  await prisma.playerStats.upsert({
    where: { userId: loserId },
    create: {
      userId: loserId,
      losses: 1,
      matchesPlayed: 1,
      goalsScored: loserScore,
      goalsConceded: winnerScore,
      skillRating: xp.loserNewRating,
      points: Math.round(xp.loserPointsGain),
      winStreak: 0,
      formScore: -5,
      formHistory: "L",
    },
    update: {
      losses: { increment: 1 },
      matchesPlayed: { increment: 1 },
      goalsScored: { increment: loserScore },
      goalsConceded: { increment: winnerScore },
      skillRating: xp.loserNewRating,
      points: { increment: Math.round(xp.loserPointsGain) },
      winStreak: { set: 0 },
      formScore: { increment: -5 },
      formHistory: {
        set: prisma.$raw`substr(('L' || coalesce(form_history,'')), 1, 10)`,
      },
    },
  });

  await prisma.pointsLog.create({
    data: {
      userId: winnerId,
      pointsChange: xp.winnerPointsGain,
      reason: `MATCH_WIN`,
      reasonText: xp.description,
      matchId,
    },
  });

  await prisma.pointsLog.create({
    data: {
      userId: loserId,
      pointsChange: Math.round(xp.loserXPLoss),
      reason: `MATCH_LOSS`,
      reasonText: xp.description,
      matchId,
    },
  });

  await recomputePlayerRankings();

  await Promise.all([
    checkAndAward(winnerId, {
      newSkillRating: xp.winnerNewRating,
      opponentSkillRating: loserRating,
      goalsScoredThisMatch: winnerScore,
      goalsConcededThisMatch: loserScore,
      isWin: true,
    }),
    checkAndAward(loserId, {
      newSkillRating: xp.loserNewRating,
      opponentSkillRating: winnerRating,
      goalsScoredThisMatch: loserScore,
      goalsConcededThisMatch: winnerScore,
      isWin: false,
    }),
  ]);

  return xp;
}

async function applyDraw(matchId: string, player1Id: string, player2Id: string) {
  const p1Stats = await prisma.playerStats.findUnique({ where: { userId: player1Id } });
  const p2Stats = await prisma.playerStats.findUnique({ where: { userId: player2Id } });

  const p1Skill = p1Stats?.skillRating ?? 1000;
  const p2Skill = p2Stats?.skillRating ?? 1000;

  const elo = calculateElo(p1Skill, p2Skill, 0, 0);

  await prisma.playerStats.update({
    where: { userId: player1Id },
    data: {
      draws: { increment: 1 },
      matchesPlayed: { increment: 1 },
      skillRating: elo.newRatingA,
      formHistory: {
        set: prisma.$raw`substr(('D' || coalesce(form_history,'')), 1, 10)`,
      },
    },
  });

  await prisma.playerStats.update({
    where: { userId: player2Id },
    data: {
      draws: { increment: 1 },
      matchesPlayed: { increment: 1 },
      skillRating: elo.newRatingB,
      formHistory: {
        set: prisma.$raw`substr(('D' || coalesce(form_history,'')), 1, 10)`,
      },
    },
  });

  const drawPoints = 5;
  await prisma.pointsLog.create({ data: { userId: player1Id, pointsChange: drawPoints, reason: "MATCH_DRAW", matchId } });
  await prisma.pointsLog.create({ data: { userId: player2Id, pointsChange: drawPoints, reason: "MATCH_DRAW", matchId } });

  await recomputePlayerRankings();

  await Promise.all([
    checkAndAward(player1Id, { isWin: false }),
    checkAndAward(player2Id, { isWin: false }),
  ]);

  return { draw: true, elo };
}

import { calculateElo } from "@/lib/xp-engine";

export async function resolveDispute(adminId: string, matchId: string, action: "overturn" | "flag_user" | "cancel"): Promise<void> {
  await audit(adminId, "MATCH_CONFIRM", matchId, { action, message: "Dispute resolved by admin" });

  if (action === "cancel") {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: { status: MatchState.CANCELLED as any, statusRaw: MatchState.CANCELLED },
    });
  } else if (action === "overturn") {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: { status: MatchState.COMPLETED as any, statusRaw: MatchState.COMPLETED },
    });
  }

  await prisma.dispute.updateMany({
    where: { matchId, status: "OPEN" },
    data: { status: "RESOLVED" },
  });
}

export async function validateChallenge(userId: string, opponentId: string): Promise<{ valid: boolean; reason?: string }> {
  if (userId === opponentId) return { valid: false, reason: "You cannot challenge yourself" };

  const recent = await db.execute({
    sql: `SELECT count(*) as c FROM match_reports 
         WHERE status_raw = 'PENDING_ACCEPTANCE'
         AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))`,
    args: [userId, opponentId, opponentId, userId],
  });
  if (Number((recent.rows[0] as Record<string, unknown>)?.c ?? 0) > 0) {
    return { valid: false, reason: "You already have a pending challenge with this player" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isShadowBanned: true, isBanned: true } });
  if (user?.isBanned) return { valid: false, reason: "Your account is suspended" };
  if (user?.isShadowBanned) return { valid: false, reason: "Your account is restricted" };

  const recentMatches = await db.execute({
    sql: `SELECT count(*) as c FROM match_reports 
         WHERE (player1_id = ? OR player2_id = ?)
         AND created_at > datetime('now', '-24 hours')`,
    args: [userId, userId],
  });
  const matchCount = Number((recentMatches.rows[0] as Record<string, unknown>)?.c ?? 0);
  if (matchCount >= 20) return { valid: false, reason: "You've reached the daily match limit (20)" };

  return { valid: true };
}
