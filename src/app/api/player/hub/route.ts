import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const userId = auth.session.userId;

  try {
    const [user, stats, ranking, club, activeTournaments, activeLeagues, upcomingFixtures, recentMatches, notifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, displayName: true, platform: true, country: true, avatarUrl: true, bio: true },
      }),
      prisma.playerStats.findUnique({
        where: { userId },
        select: { points: true, matchesPlayed: true, wins: true, losses: true, draws: true, goalsScored: true, goalsConceded: true, skillRating: true, winStreak: true, formScore: true },
      }),
      prisma.playerRanking.findUnique({
        where: { userId },
        select: { rankPosition: true, points: true, prevPosition: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { club: { select: { id: true, name: true, slug: true, tag: true } } },
      }),
      prisma.tournamentParticipant.findMany({
        where: { userId, status: { in: ["REGISTERED", "ACTIVE"] }, tournament: { status: { in: ["REGISTRATION", "LIVE"] } } },
        select: { tournament: { select: { id: true, name: true, status: true, type: true } } },
        take: 10,
      }),
      prisma.leagueParticipant.findMany({
        where: { userId, league: { status: { in: ["REGISTRATION", "LIVE"] } } },
        select: { league: { select: { id: true, name: true, status: true, type: true } } },
        take: 10,
      }),
      prisma.leagueFixture.findMany({
        where: { OR: [{ homeUserId: userId }, { awayUserId: userId }], status: "PENDING" },
        select: { id: true, matchday: true, homeUser: { select: { username: true } }, awayUser: { select: { username: true } }, league: { select: { name: true } } },
        orderBy: { matchday: "asc" },
        take: 10,
      }),
      prisma.matchReport.findMany({
        where: { OR: [{ player1Id: userId }, { player2Id: userId }] },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, score1: true, score2: true, status: true, winnerId: true, createdAt: true, player1: { select: { username: true } }, player2: { select: { username: true } } },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, message: true, isRead: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      user,
      stats,
      ranking,
      club: club?.club || null,
      activeTournaments: activeTournaments.map((p: any) => p.tournament),
      activeLeagues: activeLeagues.map((p: any) => p.league),
      upcomingFixtures,
      recentMatches,
      achievements: [],
      notifications,
    });
  } catch (error) {
    console.error("[PlayerHub] Failed:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
