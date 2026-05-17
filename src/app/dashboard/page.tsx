import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PlayerHubClient } from "@/components/PlayerHubClient";

export const dynamic = "force-dynamic";

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const userId = session.userId;

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
        playerStats: true,
        playerRanking: true,
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            tag: true,
            logoUrl: true,
            members: {
              where: { userId },
              select: { role: true },
            },
          },
        },
      },
    }),

    prisma.tournamentParticipant.findMany({
      where: { userId, status: { not: "WITHDRAWN" } },
      include: {
        tournament: {
          select: { id: true, name: true, status: true, type: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

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
    }),

    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, type: true, message: true, createdAt: true },
    }),

    prisma.notificationV2.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, message: true, isRead: true, createdAt: true },
    }),

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
    }),

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
    }),

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
    }),
  ]);

  if (!user) redirect("/login?next=/dashboard");

  const club = user.club
    ? {
        id: user.club.id,
        name: user.club.name,
        slug: user.club.slug,
        tag: user.club.tag ?? null,
        logoUrl: user.club.logoUrl,
        membershipRole: user.club.members[0]?.role ?? "MEMBER",
      }
    : null;

  const stats = user.playerStats
    ? {
        points: user.playerStats.points,
        matchesPlayed: user.playerStats.matchesPlayed,
        wins: user.playerStats.wins,
        losses: user.playerStats.losses,
        draws: user.playerStats.draws,
        goalsScored: user.playerStats.goalsScored,
        goalsConceded: user.playerStats.goalsConceded,
        skillRating: user.playerStats.skillRating,
        winStreak: user.playerStats.winStreak,
        formScore: user.playerStats.formScore,
        formHistory: user.playerStats.formHistory,
      }
    : null;

  const ranking = user.playerRanking
    ? {
        rankPosition: user.playerRanking.rankPosition,
        points: user.playerRanking.points,
        prevPosition: user.playerRanking.prevPosition,
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
