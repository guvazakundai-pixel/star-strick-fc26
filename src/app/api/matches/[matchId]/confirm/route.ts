import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { eloUpdate, recomputePlayerRankings, recomputeClubRankings } from "@/lib/ranking";

const ConfirmSchema = z.object({
  score1: z.number().int().min(0).optional(),
  score2: z.number().int().min(0).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (match.status !== "PENDING") {
    return NextResponse.json({ error: "Match is not pending confirmation" }, { status: 400 });
  }

  const confirmerId = auth.session.userId;
  if (confirmerId !== match.player1Id && confirmerId !== match.player2Id) {
    return NextResponse.json({ error: "Only match players can confirm" }, { status: 403 });
  }

  if (confirmerId === match.submittedById) {
    return NextResponse.json(
      { error: "Submitter cannot confirm their own match" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ConfirmSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const score1 = parsed.data.score1 ?? match.score1;
  const score2 = parsed.data.score2 ?? match.score2;

  let winnerId: string | null = null;
  if (score1 > score2) winnerId = match.player1Id;
  else if (score2 > score1) winnerId = match.player2Id;

  const confirmed = await prisma.matchReport.update({
    where: { id: matchId },
    data: {
      score1,
      score2,
      winnerId,
      status: "CONFIRMED",
      statusRaw: "CONFIRMED",
      confirmations: {
        submittedBy: true,
        confirmedBy: confirmerId,
        confirmedAt: new Date().toISOString(),
      },
    },
  });

  await updatePlayerStats(match.player1Id, match.player2Id, score1, score2, winnerId, match.clubId);
  await recomputePlayerRankings();
  await recomputeClubRankings();

  await prisma.auditLog.create({
    data: {
      adminId: confirmerId,
      action: "MATCH_CONFIRM",
      target: `MATCH_REPORT:${matchId}`,
      details: { score1, score2 },
    },
  });

  return NextResponse.json({ match: confirmed });
}

async function updatePlayerStats(
  player1Id: string,
  player2Id: string,
  score1: number,
  score2: number,
  winnerId: string | null,
  clubId: string | null,
) {
  const isDraw = winnerId === null;
  const p1Wins = !isDraw && winnerId === player1Id;
  const p2Wins = !isDraw && winnerId === player2Id;

  const [stats1, stats2] = await Promise.all([
    prisma.playerStats.upsert({
      where: { userId: player1Id },
      create: { userId: player1Id },
      update: {},
    }),
    prisma.playerStats.upsert({
      where: { userId: player2Id },
      create: { userId: player2Id },
      update: {},
    }),
  ]);

  const eloResult = eloUpdate(stats1.skillRating, stats2.skillRating, p1Wins ? 1 : p2Wins ? 0 : 0.5);

  const updateP1: Record<string, unknown> = {
    matchesPlayed: { increment: 1 },
    goalsScored: { increment: score1 },
    goalsConceded: { increment: score2 },
    skillRating: eloResult.ratingA,
  };
  const updateP2: Record<string, unknown> = {
    matchesPlayed: { increment: 1 },
    goalsScored: { increment: score2 },
    goalsConceded: { increment: score1 },
    skillRating: eloResult.ratingB,
  };

  if (p1Wins) {
    updateP1.wins = { increment: 1 };
    updateP1.winStreak = (stats1.winStreak ?? 0) + 1;
    updateP2.losses = { increment: 1 };
    updateP2.winStreak = 0;
  } else if (p2Wins) {
    updateP2.wins = { increment: 1 };
    updateP2.winStreak = (stats2.winStreak ?? 0) + 1;
    updateP1.losses = { increment: 1 };
    updateP1.winStreak = 0;
  } else {
    updateP1.draws = { increment: 1 };
    updateP2.draws = { increment: 1 };
    updateP1.winStreak = 0;
    updateP2.winStreak = 0;
  }

  const formHistory1 = (stats1.formHistory ?? "").toString();
  const formHistory2 = (stats2.formHistory ?? "").toString();
  const result1: "W" | "L" | "D" = p1Wins ? "W" : p2Wins ? "L" : "D";
  const result2: "W" | "L" | "D" = p2Wins ? "W" : p1Wins ? "L" : "D";
  updateP1.formHistory = (formHistory1 + result1).slice(-10);
  updateP2.formHistory = (formHistory2 + result2).slice(-10);

  const computeForm = (h: string) => {
    const recent = h.slice(-5).split("") as ("W" | "L" | "D")[];
    return recent.reduce((acc, r) => {
      if (r === "W") return acc + 10;
      if (r === "L") return acc - 5;
      return acc + 2;
    }, 0);
  };
  updateP1.formScore = computeForm(updateP1.formHistory as string);
  updateP2.formScore = computeForm(updateP2.formHistory as string);

  await Promise.all([
    prisma.playerStats.update({ where: { userId: player1Id }, data: updateP1 as any }),
    prisma.playerStats.update({ where: { userId: player2Id }, data: updateP2 as any }),
  ]);

  if (clubId) {
    await prisma.globalClubRanking.upsert({
      where: { clubId },
      create: {
        clubId,
        rankPosition: 9999,
        played: 1,
        wins: p1Wins ? 1 : 0,
        losses: p2Wins ? 1 : 0,
        draws: isDraw ? 1 : 0,
        goalsFor: score1,
        goalsAgainst: score2,
      },
      update: {
        played: { increment: 1 },
        wins: { increment: p1Wins ? 1 : 0 },
        losses: { increment: p2Wins ? 1 : 0 },
        draws: { increment: isDraw ? 1 : 0 },
        goalsFor: { increment: score1 },
        goalsAgainst: { increment: score2 },
      },
    });

    const otherClubId = await findOpponentClub(player2Id, clubId);
    if (otherClubId) {
      await prisma.globalClubRanking.upsert({
        where: { clubId: otherClubId },
        create: {
          clubId: otherClubId,
          rankPosition: 9999,
          played: 1,
          wins: p2Wins ? 1 : 0,
          losses: p1Wins ? 1 : 0,
          draws: isDraw ? 1 : 0,
          goalsFor: score2,
          goalsAgainst: score1,
        },
        update: {
          played: { increment: 1 },
          wins: { increment: p2Wins ? 1 : 0 },
          losses: { increment: p1Wins ? 1 : 0 },
          draws: { increment: isDraw ? 1 : 0 },
          goalsFor: { increment: score2 },
          goalsAgainst: { increment: score1 },
        },
      });
    }
  }
}

async function findOpponentClub(playerId: string, excludeClubId: string): Promise<string | null> {
  const membership = await prisma.clubMember.findFirst({
    where: { userId: playerId, status: "APPROVED", clubId: { not: excludeClubId } },
    select: { clubId: true },
  });
  return membership?.clubId ?? null;
}