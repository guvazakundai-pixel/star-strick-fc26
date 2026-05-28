import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/route-auth";
import { MatchState } from "@/lib/match-engine/types";
import { assertTransition } from "@/lib/match-engine/state-machine";
import { calculateXPAndPoints } from "@/lib/xp-engine";
import { checkAndAward } from "@/lib/achievements";
import { recomputePlayerRankings } from "@/lib/ranking";

export async function POST(req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { score1, score2, screenshotUrl } = body;

  if (typeof score1 !== "number" || typeof score2 !== "number" || score1 < 0 || score2 < 0) {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (isTerminal(match.statusRaw as MatchState)) {
    return NextResponse.json({ error: "Match already resolved" }, { status: 400 });
  }

  if (match.player1Id !== auth.session.userId && match.player2Id !== auth.session.userId) {
    return NextResponse.json({ error: "Not your match" }, { status: 403 });
  }

  const role = auth.session.userId === match.player1Id ? "challenger" : "opponent";

  try {
    assertTransition(match.statusRaw as MatchState, MatchState.SCORE_SUBMITTED, role);
  } catch {
    return NextResponse.json({ error: "Match is not in a state where scores can be submitted" }, { status: 400 });
  }

  const currentConfirmations = ((match.confirmations as Record<string, unknown>) || {}) as Record<string, any>;
  const key = auth.session.userId === match.player1Id ? "player1" : "player2";

  currentConfirmations[key] = {
    score1,
    score2,
    screenshotUrl,
    submittedAt: new Date().toISOString(),
    playerId: auth.session.userId,
  };

  const otherKey = key === "player1" ? "player2" : "player1";
  const otherSubmission = currentConfirmations[otherKey];
  const bothSubmitted = !!(currentConfirmations.player1 && currentConfirmations.player2);

  if (bothSubmitted) {
    const p1Sub = currentConfirmations.player1;
    const p2Sub = currentConfirmations.player2;
    const scoresMatch = p1Sub.score1 === p2Sub.score1 && p1Sub.score2 === p2Sub.score2;

    if (scoresMatch) {
      const p1Score = p1Sub.score1 as number;
      const p2Score = p1Sub.score2 as number;
      const winnerId = p1Score > p2Score ? match.player1Id : p2Score > p1Score ? match.player2Id : null;

      await prisma.matchReport.update({
        where: { id: matchId },
        data: {
          score1: p1Score,
          score2: p2Score,
          winnerId,
          status: MatchState.COMPLETED as any,
          statusRaw: MatchState.COMPLETED,
          confirmations: currentConfirmations,
          approvedById: auth.session.userId,
          approvedAt: new Date(),
        },
      });

      if (winnerId) {
        const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
        const winnerScore = Math.max(p1Score, p2Score);
        const loserScore = Math.min(p1Score, p2Score);
        await applyMatchResults(matchId, winnerId, loserId, winnerScore, loserScore);
      } else {
        await applyDraw(matchId, match.player1Id, match.player2Id, p1Score, p2Score);
      }

      return NextResponse.json({ success: true, status: "COMPLETED", verified: true });
    } else {
      await prisma.matchReport.update({
        where: { id: matchId },
        data: {
          score1,
          score2,
          status: MatchState.DISPUTED as any,
          statusRaw: MatchState.DISPUTED,
          isDisputed: true,
          confirmations: currentConfirmations,
          notes: "Score mismatch — both players submitted different results",
        },
      });

      try {
        await db.execute({
          sql: "INSERT INTO match_disputes (id, match_id, reported_by, reason, description, status, created_at) VALUES (?,?,?,?,?,?,?)",
          args: [crypto.randomUUID(), matchId, auth.session.userId, "SCORE_MISMATCH", "Both players submitted different scores — requires admin review", "OPEN", new Date().toISOString()],
        });
      } catch {}

      return NextResponse.json({
        success: true,
        status: "DISPUTED",
        message: "Scores do not match — dispute opened for admin review",
      });
    }
  } else {
    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        score1,
        score2,
        status: MatchState.SCORE_SUBMITTED as any,
        statusRaw: MatchState.SCORE_SUBMITTED,
        confirmations: currentConfirmations,
        submittedById: auth.session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      status: "SCORE_SUBMITTED",
      message: "Score submitted — waiting for opponent to confirm",
    });
  }
}

function isTerminal(state: MatchState): boolean {
  return [MatchState.COMPLETED, MatchState.CANCELLED, MatchState.EXPIRED, MatchState.AUTO_FORFEIT].includes(state);
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

  const elo = calculateXPAndPoints(p1Skill, p2Skill, p1Score, p2Score, player1Id, player2Id, 0, 0, 0, 0, 0);

  await prisma.playerStats.update({
    where: { userId: player1Id },
    data: {
      draws: { increment: 1 },
      matchesPlayed: { increment: 1 },
      skillRating: elo.winnerNewRating,
    },
  });
  await db.execute({
    sql: `UPDATE player_stats SET form_history = substr(('D' || coalesce(form_history,'')), 1, 10) WHERE user_id = ?`,
    args: [player1Id],
  });

  await prisma.playerStats.update({
    where: { userId: player2Id },
    data: {
      draws: { increment: 1 },
      matchesPlayed: { increment: 1 },
      skillRating: elo.loserNewRating,
    },
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
}