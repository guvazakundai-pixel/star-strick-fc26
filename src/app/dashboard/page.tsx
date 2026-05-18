import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PlayerHubClient } from "@/components/PlayerHubClient";

export const dynamic = "force-dynamic";

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const userId = session.userId;

  async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn(); } catch (e) { console.error("[Dashboard] Query failed:", e); return fallback; }
  }

  const [
    user,
    tournamentParticipations,
    leagueParticipations,
    activities,
    notifications,
    achievements,
    friends,
    upcomingFixtures,
  ] = await Promise.all([
    safeQuery(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          platform: true,
          country: true,
          avatarUrl: true,
          bio: true,
        },
      })
    , null),

    safeQuery(() =>
      prisma.tournamentParticipant.findMany({
        where: { userId, status: { not: "WITHDRAWN" } },
        include: {
          tournament: {
            select: { id: true, name: true, status: true, type: true, slug: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    , []),

    safeQuery(() =>
      prisma.leagueParticipant.findMany({
        where: { userId },
        include: {
          league: {
            select: {
              id: true,
              name: true,
              status: true,
              type: true,
              slug: true,
              standings: {
                where: { userId },
                select: {
                  points: true,
                  played: true,
                  wins: true,
                  draws: true,
                  losses: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
        take: 10,
      })
    , []),

    safeQuery(() =>
      prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, type: true, message: true, createdAt: true },
      })
    , []),

    safeQuery(() =>
      prisma.notificationV2.findMany({
        where: { userId, isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, title: true, message: true, isRead: true, createdAt: true },
      })
    , []),

    safeQuery(() =>
      prisma.playerAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          description: true,
          icon: true,
          category: true,
          rarity: true,
          unlockedAt: true,
        },
      })
    , []),

    safeQuery(() =>
      prisma.friend.findMany({
        where: {
          OR: [
            { senderId: userId, status: "ACCEPTED" },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              playerRanking: { select: { rankPosition: true } },
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              playerRanking: { select: { rankPosition: true } },
            },
          },
        },
      })
    , []),

    safeQuery(() =>
      prisma.leagueFixture.findMany({
        where: {
          status: "PENDING",
          OR: [{ homeUserId: userId }, { awayUserId: userId }],
        },
        include: {
          league: { select: { name: true } },
          homeUser: { select: { username: true } },
          awayUser: { select: { username: true } },
        },
        orderBy: { matchday: "asc" },
        take: 10,
      })
    , []),
  ]);

  const clubData = await safeQuery(() =>
    prisma.club.findFirst({
      where: { clubMembers: { some: { userId } } },
      select: { id: true, name: true, slug: true, tag: true, logoUrl: true },
    })
  , null);

  const playerStatsData = await safeQuery(() =>
    prisma.playerStats.findUnique({ where: { userId } })
  , null);

  const playerRankingData = await safeQuery(() =>
    prisma.playerRanking.findUnique({ where: { userId } })
  , null);

  if (!user) {
    return (
      <div className="broadcast-theme min-h-screen bc-grain">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="text-center py-20 px-6">
            <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.12)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-9 w-9 text-negative/70"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
            </div>
            <h2 className="bc-headline text-2xl text-ink mb-2">Failed to load dashboard</h2>
            <p className="text-sm text-muted-soft max-w-md mx-auto mb-6">We couldn&apos;t load your player data. Try again.</p>
            <a href="/dashboard" className="btn-primary inline-flex items-center justify-center h-11 px-6 rounded-[14px] text-sm font-bold">Try Again</a>
          </div>
        </div>
      </div>
    );
  }

  const club = clubData
    ? {
        id: clubData.id,
        name: clubData.name,
        slug: clubData.slug,
        tag: clubData.tag ?? null,
        logoUrl: clubData.logoUrl,
        membershipRole: "MEMBER",
      }
    : null;

  const stats = playerStatsData
    ? {
        points: playerStatsData.points,
        matchesPlayed: playerStatsData.matchesPlayed,
        wins: playerStatsData.wins,
        losses: playerStatsData.losses,
        draws: playerStatsData.draws,
        goalsScored: playerStatsData.goalsScored,
        goalsConceded: playerStatsData.goalsConceded,
        skillRating: playerStatsData.skillRating,
        winStreak: playerStatsData.winStreak,
        formScore: playerStatsData.formScore,
        formHistory: playerStatsData.formHistory,
      }
    : null;

  const ranking = playerRankingData
    ? {
        rankPosition: playerRankingData.rankPosition,
        points: playerRankingData.points,
        prevPosition: playerRankingData.prevPosition,
      }
    : null;

  const activeTournaments = tournamentParticipations
    .filter((tp) => tp.tournament.status !== "COMPLETED")
    .map((tp) => ({
      id: tp.tournament.id,
      name: tp.tournament.name,
      status: tp.tournament.status,
      type: tp.tournament.type,
      slug: tp.tournament.slug,
      participantStatus: tp.status,
    }));

  const activeLeagues = leagueParticipations.map((lp) => {
    const standing = lp.league.standings[0];
    return {
      id: lp.league.id,
      name: lp.league.name,
      status: lp.league.status,
      type: lp.league.type,
      slug: lp.league.slug,
      standing: standing
        ? {
            points: standing.points,
            played: standing.played,
            wins: standing.wins,
            draws: standing.draws,
            losses: standing.losses,
          }
        : null,
    };
  });

  const friendsList = friends.map((f) => {
    const friendUser = f.sender.id === userId ? f.receiver : f.sender;
    return {
      id: friendUser.id,
      username: friendUser.username,
      displayName: friendUser.displayName,
      avatarUrl: friendUser.avatarUrl,
      playerRanking: friendUser.playerRanking,
    };
  });

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <PlayerHubClient
        user={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          platform: user.platform ?? "CROSSPLAY",
          country: user.country,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
        }}
        stats={stats}
        ranking={ranking}
        club={club}
        activeTournaments={activeTournaments}
        activeLeagues={activeLeagues}
        upcomingFixtures={upcomingFixtures.map((f) => ({
          id: f.id,
          matchday: f.matchday,
          homeUser: { username: f.homeUser.username },
          awayUser: { username: f.awayUser.username },
          league: { name: f.league.name },
        }))}
        achievements={achievements.map((a) => ({
          ...a,
          unlockedAt: a.unlockedAt.toISOString(),
        }))}
        activities={activities.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        }))}
        notifications={notifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
        friends={friendsList}
      />
    </div>
  );
}
