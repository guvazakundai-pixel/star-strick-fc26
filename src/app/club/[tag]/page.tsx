import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ClubDetailClient } from "@/components/ClubDetailClient";

export const dynamic = "force-dynamic";

export default async function ClubDetailPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  const session = await getSession();

  const club = await prisma.club.findFirst({
    where: {
      OR: [{ slug: tag }, { tag: tag.toUpperCase() }],
    },
    include: {
      globalRank: true,
      manager: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      _count: {
        select: { members: true, achievements: true, activity: true, posts: true },
      },
    },
  });

  if (!club) notFound();

  const [members, achievements, recentActivity, rivals, recentMatches] =
    await Promise.all([
      prisma.clubMember.findMany({
        where: { clubId: club.id, status: "APPROVED" },
        orderBy: [{ clubXp: "desc" }, { joinedAt: "asc" }],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              country: true,
              stats: {
                select: {
                  points: true,
                  wins: true,
                  losses: true,
                  draws: true,
                  skillRating: true,
                  winStreak: true,
                },
              },
              playerRanking: { select: { rankPosition: true } },
            },
          },
        },
      }),

      prisma.clubAchievement.findMany({
        where: { clubId: club.id },
        orderBy: { earnedAt: "desc" },
      }),

      prisma.clubActivity.findMany({
        where: { clubId: club.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
        },
      }),

      prisma.rivalry.findMany({
        where: {
          OR: [{ club1Id: club.id }, { club2Id: club.id }],
        },
        include: {
          club1: {
            select: {
              id: true,
              name: true,
              slug: true,
              tag: true,
              logoUrl: true,
              clubXp: true,
              globalRank: { select: { rankPosition: true } },
            },
          },
          club2: {
            select: {
              id: true,
              name: true,
              slug: true,
              tag: true,
              logoUrl: true,
              clubXp: true,
              globalRank: { select: { rankPosition: true } },
            },
          },
        },
      }),

      prisma.matchReport.findMany({
        where: {
          clubId: club.id,
          status: { in: ["CONFIRMED", "APPROVED"] },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          player1: { select: { id: true, username: true, displayName: true } },
          player2: { select: { id: true, username: true, displayName: true } },
          winner: { select: { id: true, username: true, displayName: true } },
        },
      }),
    ]);

  const memberIds = members.map((m) => m.user.id);

  const [leagues, tournaments] = await Promise.all([
    prisma.league.findMany({
      where: {
        status: { in: ["REGISTRATION", "LIVE"] },
        participants: { some: { userId: { in: memberIds } } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        maxPlayers: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.tournament.findMany({
      where: {
        status: { in: ["REGISTRATION", "LIVE"] },
        participants: { some: { userId: { in: memberIds } } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        status: true,
        maxPlayers: true,
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rivalryData = rivals.map((r) => {
    const isClub1 = r.club1Id === club.id;
    const rival = isClub1 ? r.club2 : r.club1;
    return {
      clubId: rival.id,
      name: rival.name,
      slug: rival.slug,
      tag: rival.tag ?? "",
      logoUrl: rival.logoUrl,
      clubXp: rival.clubXp,
      rank: rival.globalRank?.rankPosition ?? 0,
      ourWins: isClub1 ? r.club1Wins : r.club2Wins,
      theirWins: isClub1 ? r.club2Wins : r.club1Wins,
      draws: r.draws,
    };
  });

  const isMember = session ? members.some((m) => m.user.id === session.userId) : false;
  const isManager = session ? club.managerId === session.userId : false;

  const clubData = {
    ...club,
    featuredLegends: club.featuredLegends ? JSON.parse(club.featuredLegends) : [],
    trophies: club.trophies ? JSON.parse(club.trophies) : [],
    memberCount: club._count.members,
    achievementCount: club._count.achievements,
    activityCount: club._count.activity,
    createdAt: club.createdAt.toISOString(),
    manager: club.manager,
    globalRank: club.globalRank
      ? {
          rankPosition: club.globalRank.rankPosition,
          prevPosition: club.globalRank.prevPosition,
          totalPoints: club.globalRank.totalPoints,
          wins: club.globalRank.wins,
          losses: club.globalRank.losses,
          draws: club.globalRank.draws,
          played: club.globalRank.played,
          goalsFor: club.globalRank.goalsFor,
          goalsAgainst: club.globalRank.goalsAgainst,
          momentum: club.globalRank.momentum,
        }
      : null,
  };

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <ClubDetailClient
        club={clubData}
        members={members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
          user: {
            ...m.user,
            stats: m.user.stats
              ? {
                  points: m.user.stats.points,
                  wins: m.user.stats.wins,
                  losses: m.user.stats.losses,
                  draws: m.user.stats.draws,
                  skillRating: m.user.stats.skillRating,
                  winStreak: m.user.stats.winStreak,
                }
              : null,
            playerRanking: m.user.playerRanking
              ? { rankPosition: m.user.playerRanking.rankPosition }
              : null,
          },
        }))}
        isMember={isMember}
        isManager={isManager}
        activities={recentActivity.map((a) => ({
          ...a,
          metadata: a.metadata as Record<string, unknown> | null,
          createdAt: a.createdAt.toISOString(),
          user: a.user,
        }))}
        leagues={leagues.map((l) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          type: l.type,
          status: l.status,
          participantCount: l._count.participants,
          maxPlayers: l.maxPlayers,
        }))}
        tournaments={tournaments.map((t) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          type: t.type,
          status: t.status,
          participantCount: t._count.participants,
          maxPlayers: t.maxPlayers,
        }))}
        achievements={achievements.map((a) => ({
          ...a,
          earnedAt: a.earnedAt.toISOString(),
        }))}
        rivals={rivalryData}
        recentMatches={recentMatches.map((m) => ({
          id: m.id,
          score1: m.score1,
          score2: m.score2,
          player1: { id: m.player1.id, username: m.player1.username, displayName: m.player1.displayName },
          player2: { id: m.player2.id, username: m.player2.username, displayName: m.player2.displayName },
          winner: m.winner
            ? { id: m.winner.id, username: m.winner.username, displayName: m.winner.displayName }
            : null,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
