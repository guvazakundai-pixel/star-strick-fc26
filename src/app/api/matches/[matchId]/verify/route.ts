import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { MatchState } from "@/lib/match-engine/types";
import { isTerminal } from "@/lib/match-engine/state-machine";
import { calculateXPAndPoints, calculateElo } from "@/lib/xp-engine";
import { checkAndAward } from "@/lib/achievements";
import { recomputePlayerRankings } from "@/lib/ranking";
import { audit } from "@/lib/audit";
import {
  notifyMatchCompleted,
  notifyDisputeOpened,
} from "@/lib/match-engine/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { matchId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { confirm, disputeReason } = body;

  if (confirm !== true && confirm !== false) {
    return NextResponse.json({ error: "confirm must be true or false" }, { status: 400 });
  }

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (match.player1Id !== auth.session.userId && match.player2Id !== auth.session.userId) {
    return NextResponse.json({ error: "Only match players can verify" }, { status: 403 });
  }

  if (isTerminal(match.statusRaw as MatchState)) {
    return NextResponse.json({ error: "Match is already resolved" }, { status: 400 });
  }

  const state = match.statusRaw as MatchState;

  if (!confirm) {
    if (state !== MatchState.SCORE_SUBMITTED && state !== MatchState.PENDING_VERIFICATION) {
      return NextResponse.json({ error: "Match is not in a verifiable state" }, { status: 400 });
    }

    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        status: MatchState.DISPUTED as any,
        statusRaw: MatchState.DISPUTED,
        isDisputed: true,
        notes: disputeReason ?? "Score disputed",
      },
    });

    await notifyDisputeOpened(match.player1Id, matchId);
    await notifyDisputeOpened(match.player2Id, matchId);

    try {
      await prisma.dispute.create({
        data: {
          matchId,
          reportedById: auth.session.userId,
          reason: disputeReason ?? "Score dispute",
          status: "OPEN",
        },
      });
    } catch {}

    await audit(auth.session.userId, "MATCH_DISPUTE", matchId, { reason: disputeReason });

    return NextResponse.json({
      status: "DISPUTED",
      message: "Match has been disputed. An admin will review.",
      disputeTicketCreated: true,
    });
  }

  if (state === MatchState.SCORE_SUBMITTED) {
    const submissions = (match.confirmations as Record<string, any>) ?? {};
    const submitter = submissions.player1 || submissions.player2;
    const p1Score = match.score1;
    const p2Score = match.score2;

    if (p1Score == null || p2Score == null) {
      return NextResponse.json({ error: "No scores found for this match" }, { status: 400 });
    }

    let winnerId: string | null = null;
    let loserId: string | null = null;
    let winnerScore = 0;
    let loserScore = 0;

    if (p1Score > p2Score) {
      winnerId = match.player1Id;
      loserId = match.player2Id;
      winnerScore = p1Score;
      loserScore = p2Score;
    } else if (p2Score > p1Score) {
      winnerId = match.player2Id;
      loserId = match.player1Id;
      winnerScore = p2Score;
      loserScore = p1Score;
    }

    const confirmed = await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        status: MatchState.COMPLETED as any,
        statusRaw: MatchState.COMPLETED,
        winnerId,
        approvedById: auth.session.userId,
        approvedAt: new Date(),
        confirmations: {
          ...submissions,
          confirmedBy: auth.session.userId,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    if (winnerId && loserId) {
      const xpResult = await applyMatchResults(matchId, winnerId, loserId, winnerScore, loserScore);
      await notifyMatchCompleted(winnerId, "won", matchId);
      await notifyMatchCompleted(loserId, "lost", matchId);
      await audit(auth.session.userId, "MATCH_CONFIRM", matchId, { result: `${winnerScore}-${loserScore}`, xp: xpResult });
      return NextResponse.json({
        status: "COMPLETED",
        message: "Match verified successfully! XP and rankings updated.",
        xpResult,
      });
    } else {
      const xpResult = await applyDraw(matchId, match.player1Id, match.player2Id, p1Score, p2Score);
      await notifyMatchCompleted(match.player1Id, "draw", matchId);
      await notifyMatchCompleted(match.player2Id, "draw", matchId);
      return NextResponse.json({
        status: "COMPLETED",
        message: "Match verified as a draw!",
        xpResult,
      });
    }
  }

  return NextResponse.json({ error: `Cannot verify match in state ${state}` }, { status: 400 });
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
    },
  });

  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('W' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [winnerId],
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
    },
  });

  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('L' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [loserId],
  });

  await prisma.pointsLog.create({
    data: {
      userId: winnerId,
      pointsChange: xp.winnerPointsGain,
      reason: "MATCH_WIN",
      reasonText: xp.description,
      matchId,
    },
  });

  await prisma.pointsLog.create({
    data: {
      userId: loserId,
      pointsChange: Math.round(xp.loserXPLoss),
      reason: "MATCH_LOSS",
      reasonText: xp.description,
      matchId,
    },
  });

  await recomputePlayerRankings();

  await Promise.all([
    checkAndAward(winnerId, {
      newSkillRating: xp.winnerNewRating,
      oldSkillRating: winnerRating,
      opponentSkillRating: loserRating,
      goalsScoredThisMatch: winnerScore,
      goalsConcededThisMatch: loserScore,
      isWin: true,
    }),
    checkAndAward(loserId, {
      newSkillRating: xp.loserNewRating,
      oldSkillRating: loserRating,
      opponentSkillRating: winnerRating,
      goalsScoredThisMatch: loserScore,
      goalsConcededThisMatch: winnerScore,
      isWin: false,
    }),
  ]);

  return xp;
}

async function applyDraw(
  matchId: string,
  player1Id: string,
  player2Id: string,
  p1Score: number,
  p2Score: number,
) {
  const p1Stats = await prisma.playerStats.findUnique({ where: { userId: player1Id } });
  const p2Stats = await prisma.playerStats.findUnique({ where: { userId: player2Id } });

  const p1Skill = p1Stats?.skillRating ?? 1000;
  const p2Skill = p2Stats?.skillRating ?? 1000;

  const elo = calculateElo(p1Skill, p2Skill, 0, 0);

  await prisma.playerStats.upsert({
    where: { userId: player1Id },
    create: { userId: player1Id, draws: 1, matchesPlayed: 1, skillRating: elo.newRatingA },
    update: { draws: { increment: 1 }, matchesPlayed: { increment: 1 }, skillRating: elo.newRatingA },
  });
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [player1Id],
  });

  await prisma.playerStats.upsert({
    where: { userId: player2Id },
    create: { userId: player2Id, draws: 1, matchesPlayed: 1, skillRating: elo.newRatingB },
    update: { draws: { increment: 1 }, matchesPlayed: { increment: 1 }, skillRating: elo.newRatingB },
  });
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [player2Id],
  });

  const drawPoints = 5;
  await prisma.pointsLog.create({ data: { userId: player1Id, pointsChange: drawPoints, reason: "MATCH_DRAW", matchId } });
  await prisma.pointsLog.create({ data: { userId: player2Id, pointsChange: drawPoints, reason: "MATCH_DRAW", matchId } });

  await recomputePlayerRankings();

  await Promise.all([
    checkAndAward(player1Id, { isWin: false }),
    checkAndAward(player2Id, { isWin: false }),
  ]);

  return { draw: true, winnerNewRating: elo.newRatingA, loserNewRating: elo.newRatingB, winnerXPGain: drawPoints, loserXPLoss: 0, bonuses: { giantSlayer: 0, cleanSheet: 0, goalMargin: 0, winStreak: 0 }, description: "Draw match — both players earn 5 points" };
}
