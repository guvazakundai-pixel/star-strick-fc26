import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileSkeleton } from "@/components/Skeleton";
import PlayerProfileClient from "./PlayerProfileClient";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        country: true,
        platform: true,
        avatarUrl: true,
        fcUsername: true,
        createdAt: true,
        clubId: true,
      },
    });
  } catch {
    notFound();
  }

  if (!user) notFound();

  let ranking, stats, club, recentMatches;
  try {
    [ranking, stats, club, recentMatches] = await Promise.all([
      prisma.playerRanking.findUnique({ where: { userId: user.id } }),
      prisma.playerStats.findUnique({ where: { userId: user.id } }),
      user.clubId
        ? prisma.club.findUnique({
            where: { id: user.clubId },
            select: { id: true, name: true, tag: true, slug: true, logoUrl: true },
          })
        : Promise.resolve(null),
      prisma.matchReport.findMany({
        where: {
          OR: [{ player1Id: user.id }, { player2Id: user.id }],
          status: { in: ["CONFIRMED", "APPROVED"] },
        },
        include: {
          player1: { select: { id: true, username: true, displayName: true } },
          player2: { select: { id: true, username: true, displayName: true } },
          winner: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
  } catch {
    ranking = null;
    stats = null;
    club = null;
    recentMatches = [];
  }

  const matchesData = recentMatches.map((m) => {
    const isP1 = m.player1Id === user.id;
    const opponent = isP1 ? m.player2 : m.player1;
    const myScore = isP1 ? m.score1 : m.score2;
    const oppScore = isP1 ? m.score2 : m.score1;
    const didWin = m.winnerId === user.id;
    const isDraw = !m.winnerId;
    return {
      id: m.id,
      opponent: { username: opponent.username, displayName: opponent.displayName },
      myScore,
      oppScore,
      didWin,
      isDraw,
      date: m.createdAt.toISOString(),
    };
  });

  const profileData = {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      country: user.country,
      platform: user.platform,
      avatarUrl: user.avatarUrl,
      fcUsername: user.fcUsername,
      createdAt: user.createdAt.toISOString(),
    },
    ranking: ranking ? {
      rankPosition: ranking.rankPosition,
      points: ranking.points,
      rankChange: ranking.rankChange,
      finalScore: ranking.finalScore,
    } : null,
    stats: stats ? {
      matchesPlayed: stats.matchesPlayed,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws,
      goalsScored: stats.goalsScored,
      goalsConceded: stats.goalsConceded,
      skillRating: stats.skillRating,
      points: stats.points,
      winStreak: stats.winStreak,
      formHistory: stats.formHistory as string,
    } : null,
    club: club ? {
      id: club.id,
      name: club.name,
      tag: club.tag,
      slug: club.slug,
      logoUrl: club.logoUrl,
    } : null,
    recentMatches: matchesData,
  };

  return (
    <ErrorBoundary>
      <PlayerProfileClient data={profileData} />
    </ErrorBoundary>
  );
}