import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import JoinButton from "./JoinButton";

function statusPill(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    DRAFT: { cls: "bg-surface-2 border-border text-muted-soft", label: "Draft" },
    REGISTRATION: { cls: "bg-emerald/15 border-emerald/25 text-emerald", label: "Registration" },
    LIVE: { cls: "bg-accent/15 border-accent/25 text-accent", label: "Live" },
    COMPLETED: { cls: "bg-gold/15 border-gold/25 text-gold", label: "Completed" },
    ARCHIVED: { cls: "bg-surface-2 border-border text-muted-soft", label: "Archived" },
  };
  const m = map[status] ?? map.DRAFT;
  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  );
}

export default async function LeagueDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();

  const league = await prisma.league.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      _count: { select: { members: true } },
      seasons: {
        orderBy: { seasonNumber: "desc" },
        take: 1,
        include: {
          standings: {
            orderBy: { position: "asc" },
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
          },
          fixtures: {
            orderBy: [{ matchday: "asc" }, { createdAt: "asc" }],
            include: {
              home: { select: { id: true, username: true, displayName: true } },
              away: { select: { id: true, username: true, displayName: true } },
            },
          },
        },
      },
    },
  });
  if (!league) notFound();

  const currentSeason = league.seasons[0];
  const isOwner = !!session && session.userId === league.ownerId;

  const myMembership = session
    ? await prisma.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId: league.id, userId: session.userId } },
        select: { status: true },
      })
    : null;
  const isMember = myMembership?.status === "ACTIVE";

  const upcomingFixtures = currentSeason
    ? currentSeason.fixtures.filter((f) => f.status === "SCHEDULED" || f.status === "SUBMITTED").slice(0, 5)
    : [];

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/leagues"
          className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← Back to Leagues
        </Link>

        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {statusPill(league.status)}
              <span className="rounded-full bg-surface-2 border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-soft">
                {league.format.replace("_", " ").toLowerCase()}
              </span>
              <span className="rounded-full bg-surface-2 border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-soft">
                {league._count.members}/{league.maxPlayers} members
              </span>
            </div>
            <h1 className="cinematic-heading text-3xl sm:text-4xl text-ink">{league.name}</h1>
            {league.description && <p className="mt-2 text-sm text-muted max-w-2xl">{league.description}</p>}
            <p className="mt-2 text-xs font-mono text-muted-soft">
              {league.region} · Owner @{league.owner.username}
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {isOwner && (
              <Link
                href={`/leagues/${league.slug}/manage`}
                className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 transition-opacity"
              >
                Manage
              </Link>
            )}
            {session && !isOwner && !isMember && league.status !== "ARCHIVED" && league.status !== "COMPLETED" && (
              <JoinButton slug={league.slug} joinPolicy={league.joinPolicy} />
            )}
            {isMember && !isOwner && (
              <span className="rounded-full bg-emerald/15 border border-emerald/25 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald">
                Joined
              </span>
            )}
            {!session && (
              <Link
                href={`/login?next=/leagues/${league.slug}`}
                className="rounded-full border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-soft hover:text-ink transition-colors"
              >
                Log in to join
              </Link>
            )}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section>
              <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                {currentSeason ? `${currentSeason.name} · Table` : "Table"}
              </h2>
              {!currentSeason ? (
                <div className="frosted-card-sm p-6 text-center">
                  <p className="text-muted-soft font-mono text-sm">No season yet</p>
                  {isOwner && (
                    <p className="text-muted-soft text-xs mt-2">
                      Start one from the Manage page.
                    </p>
                  )}
                </div>
              ) : currentSeason.standings.length === 0 ? (
                <div className="frosted-card-sm p-6 text-center">
                  <p className="text-muted-soft font-mono text-sm">No participants</p>
                </div>
              ) : (
                <div className="frosted-card-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-soft">
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Player</th>
                        <th className="px-2 py-2 text-center">P</th>
                        <th className="px-2 py-2 text-center">W</th>
                        <th className="px-2 py-2 text-center">D</th>
                        <th className="px-2 py-2 text-center">L</th>
                        <th className="px-2 py-2 text-center">GF</th>
                        <th className="px-2 py-2 text-center">GA</th>
                        <th className="px-2 py-2 text-center">GD</th>
                        <th className="px-2 py-2 text-center">Pts</th>
                        <th className="px-3 py-2 text-left">Form</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSeason.standings.map((s) => (
                        <tr key={s.id} className="border-b border-border/40 last:border-0">
                          <td className="px-3 py-2 text-muted-soft font-mono">{s.position || "-"}</td>
                          <td className="px-3 py-2 text-ink">
                            @{s.user.username}
                          </td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.played}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.wins}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.draws}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.losses}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.goalsFor}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.goalsAgainst}</td>
                          <td className="px-2 py-2 text-center font-mono text-muted">{s.goalsFor - s.goalsAgainst}</td>
                          <td className="px-2 py-2 text-center font-mono text-ink font-bold">{s.points}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {s.form.split("").map((c, i) => (
                              <span
                                key={i}
                                className={
                                  c === "W"
                                    ? "text-emerald"
                                    : c === "L"
                                      ? "text-accent"
                                      : "text-muted-soft"
                                }
                              >
                                {c}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {currentSeason && (
              <section>
                <h2 className="bc-headline text-sm font-bold uppercase tracking-wider text-ink mb-3">
                  Upcoming Fixtures
                </h2>
                {upcomingFixtures.length === 0 ? (
                  <div className="frosted-card-sm p-6 text-center">
                    <p className="text-muted-soft font-mono text-sm">All matches played</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingFixtures.map((f) => (
                      <Link
                        key={f.id}
                        href={`/fixtures/${f.id}`}
                        className="frosted-card-sm p-3 flex items-center justify-between hover:border-accent/18 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-muted-soft uppercase">
                            MD {f.matchday}
                          </span>
                          <span className="text-ink text-sm">
                            @{f.home.username} <span className="text-muted-soft">vs</span> @{f.away.username}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-soft uppercase">
                          {f.status.toLowerCase()}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4">
            {currentSeason && (
              <div className="frosted-card-sm p-4">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-2">
                  Season
                </h3>
                <p className="text-ink font-display text-lg">{currentSeason.name}</p>
                <p className="text-muted-soft text-xs mt-1">
                  Phase: {currentSeason.phase.toLowerCase()}
                </p>
                <p className="text-muted-soft text-xs mt-2">
                  {currentSeason.fixtures.length} fixtures total
                </p>
              </div>
            )}
            <div className="frosted-card-sm p-4">
              <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-2">
                Join policy
              </h3>
              <p className="text-ink text-sm">
                {league.joinPolicy === "INVITE" && "Invite code required"}
                {league.joinPolicy === "OPEN" && "Open to anyone"}
                {league.joinPolicy === "PASSWORD" && "Password required"}
                {league.joinPolicy === "APPROVAL" && "Owner approves"}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
