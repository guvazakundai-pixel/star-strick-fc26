import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ManagePanel from "./ManagePanel";

export default async function ManageLeaguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/leagues/${slug}/manage`);

  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      _count: { select: { members: true, seasons: true } },
      members: {
        where: { status: "ACTIVE" },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      seasons: {
        orderBy: { seasonNumber: "desc" },
        take: 1,
        include: {
          _count: { select: { fixtures: true } },
        },
      },
      invites: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!league) notFound();

  const isOwner = league.ownerId === session.userId;
  const isAdmin = session.role === "ADMIN";
  if (!isOwner && !isAdmin) redirect(`/leagues/${slug}`);

  const pendingFixtures = await prisma.fixture.findMany({
    where: {
      season: { leagueId: league.id },
      status: { in: ["CONFIRMED", "DISPUTED", "SUBMITTED"] },
    },
    include: {
      home: { select: { username: true } },
      away: { select: { username: true } },
      submittedBy: { select: { username: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Link
          href={`/leagues/${slug}`}
          className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Back to {league.name}
        </Link>
        <h1 className="cinematic-heading text-3xl text-ink mb-1">Manage</h1>
        <p className="text-muted-soft text-sm mb-6">
          Owner controls: invites, season start, result authentication.
        </p>

        <ManagePanel
          slug={league.slug}
          currentSeason={league.seasons[0] ?? null}
          memberCount={league._count.members}
          members={league.members.map((m) => ({
            id: m.user.id,
            username: m.user.username,
            displayName: m.user.displayName,
            joinedAt: m.joinedAt.toISOString(),
          }))}
          invites={league.invites.map((i) => ({
            id: i.id,
            code: i.code,
            uses: i.uses,
            maxUses: i.maxUses,
            expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
            disabled: i.disabled,
          }))}
          pendingFixtures={pendingFixtures.map((f) => ({
            id: f.id,
            matchday: f.matchday,
            home: f.home.username,
            away: f.away.username,
            status: f.status,
            submittedHomeScore: f.submittedHomeScore,
            submittedAwayScore: f.submittedAwayScore,
            disputedHomeScore: f.disputedHomeScore,
            disputedAwayScore: f.disputedAwayScore,
            submittedBy: f.submittedBy?.username ?? null,
          }))}
        />
      </div>
    </div>
  );
}
