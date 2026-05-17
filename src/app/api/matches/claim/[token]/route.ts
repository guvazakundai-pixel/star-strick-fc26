import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChallengeToken } from "@/lib/match-engine/challenge-token";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const tokenData = await getChallengeToken(token);
  if (!tokenData) {
    return NextResponse.json({ error: "Challenge link is invalid or expired" }, { status: 404 });
  }

  if (tokenData.used) {
    return NextResponse.json({ error: "Challenge link has already been used" }, { status: 410 });
  }

  if (new Date(tokenData.expiresAt) < new Date()) {
    return NextResponse.json({ error: "Challenge link has expired" }, { status: 410 });
  }

  const challenger = await prisma.user.findUnique({
    where: { id: tokenData.challengerId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      city: true,
    },
  });

  if (!challenger) {
    return NextResponse.json({ error: "Challenger not found" }, { status: 404 });
  }

  const challengerStats = await prisma.playerStats.findUnique({
    where: { userId: tokenData.challengerId },
    select: { skillRating: true, wins: true, losses: true, winStreak: true, matchesPlayed: true },
  });

  const challengerRanking = await prisma.playerRanking.findUnique({
    where: { userId: tokenData.challengerId },
    select: { rankPosition: true },
  });

  return NextResponse.json({
    token: tokenData.token,
    matchType: tokenData.matchType,
    platform: tokenData.platform,
    region: tokenData.region,
    wagerAmount: tokenData.wagerAmount,
    expiresAt: tokenData.expiresAt,
    challenger: {
      ...challenger,
      stats: challengerStats ? {
        rating: Math.round(challengerStats.skillRating),
        wins: challengerStats.wins,
        losses: challengerStats.losses,
        winStreak: challengerStats.winStreak,
        matchesPlayed: challengerStats.matchesPlayed,
        winRate: challengerStats.matchesPlayed > 0
          ? Math.round((challengerStats.wins / challengerStats.matchesPlayed) * 100)
          : 0,
      } : null,
      rank: challengerRanking?.rankPosition ?? null,
    },
  });
}
