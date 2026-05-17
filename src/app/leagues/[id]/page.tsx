import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LeagueDetailClient } from "@/components/LeagueDetailClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      admin: { select: { id: true, username: true, displayName: true } },
      participants: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { joinedAt: "asc" },
      },
      standings: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: [{ points: "desc" }, { goalDifference: "desc" }, { goalsFor: "desc" }],
      },
      fixtures: {
        include: {
          homeUser: { select: { id: true, username: true, displayName: true } },
          awayUser: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
      },
      seasons: { orderBy: { seasonNumber: "desc" } },
      _count: { select: { participants: true } },
    },
  });

  if (!league) redirect("/leagues");

  const isMember = session ? league.participants.some((p) => p.userId === session.userId) : false;
  const isAdmin = session ? league.adminId === session.userId : false;

  const standings = league.standings.map((s) => ({
    userId: s.userId,
    username: s.user.username,
    displayName: s.user.displayName,
    points: s.points,
    played: s.played,
    wins: s.wins,
    draws: s.draws,
    losses: s.losses,
    goalsFor: s.goalsFor,
    goalsAgainst: s.goalsAgainst,
    goalDifference: s.goalDifference,
    form: s.form,
  }));

  const fixtures = league.fixtures.map((f) => ({
    id: f.id,
    matchday: f.matchday,
    homeUser: { id: f.homeUser.id, username: f.homeUser.username, displayName: f.homeUser.displayName },
    awayUser: { id: f.awayUser.id, username: f.awayUser.username, displayName: f.awayUser.displayName },
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    status: f.status,
  }));

  const participants = league.participants.map((p) => ({
    id: p.id,
    userId: p.userId,
    username: p.user.username,
    displayName: p.user.displayName,
  }));

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <LeagueDetailClient
          league={{
            id: league.id,
            name: league.name,
            description: league.description,
            type: league.type,
            status: league.status,
            season: league.seasons[0]?.seasonNumber?.toString() ?? null,
            maxPlayers: league.maxPlayers,
            participantCount: league._count.participants,
            inviteCode: league.inviteCode,
            playoffQualifiers: league.playoffQualifiers,
            playoffType: league.playoffType,
            playoffGenerated: league.playoffGenerated,
            admin: { id: league.admin.id, username: league.admin.username, displayName: league.admin.displayName },
          }}
          standings={standings}
          fixtures={fixtures}
          participants={participants}
          isMember={isMember}
          isAdmin={isAdmin}
          currentUserId={session?.userId}
        />
      </div>
    </div>
  );
}
