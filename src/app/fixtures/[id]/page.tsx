import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import FixturePanel from "./FixturePanel";

export default async function FixturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      home: { select: { id: true, username: true, displayName: true } },
      away: { select: { id: true, username: true, displayName: true } },
      submittedBy: { select: { username: true } },
      confirmedBy: { select: { username: true } },
      authenticatedBy: { select: { username: true } },
      season: {
        select: {
          name: true,
          league: { select: { id: true, slug: true, name: true, ownerId: true } },
        },
      },
    },
  });
  if (!fixture) notFound();

  const isOwner = !!session && session.userId === fixture.season.league.ownerId;
  const isHome = !!session && session.userId === fixture.homeId;
  const isAway = !!session && session.userId === fixture.awayId;
  const role: "HOME" | "AWAY" | "OWNER" | "OTHER" = isOwner
    ? "OWNER"
    : isHome
      ? "HOME"
      : isAway
        ? "AWAY"
        : "OTHER";

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <Link
          href={`/leagues/${fixture.season.league.slug}`}
          className="text-muted-soft hover:text-ink text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 mb-4"
        >
          ← {fixture.season.league.name}
        </Link>

        <header className="mb-6">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-2">
            {fixture.season.name} · Matchday {fixture.matchday}
          </p>
          <div className="flex items-center justify-center gap-6 text-center">
            <div className="flex-1">
              <p className="text-ink text-2xl font-display">@{fixture.home.username}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mt-1">Home</p>
            </div>
            <div className="text-3xl font-display text-muted-soft">vs</div>
            <div className="flex-1">
              <p className="text-ink text-2xl font-display">@{fixture.away.username}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mt-1">Away</p>
            </div>
          </div>
          {fixture.status === "AUTHENTICATED" && (
            <div className="mt-6 text-center">
              <p className="text-5xl font-display text-ink">
                {fixture.homeScore} <span className="text-muted-soft">-</span> {fixture.awayScore}
              </p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-emerald mt-2">
                Authenticated by @{fixture.authenticatedBy?.username}
              </p>
            </div>
          )}
          {fixture.status === "VOID" && (
            <div className="mt-6 text-center">
              <p className="text-2xl font-display text-muted-soft">VOID</p>
            </div>
          )}
        </header>

        <FixturePanel
          fixtureId={fixture.id}
          status={fixture.status as "SCHEDULED" | "SUBMITTED" | "CONFIRMED" | "AUTHENTICATED" | "DISPUTED" | "VOID"}
          role={role}
          submittedById={fixture.submittedById}
          submittedHomeScore={fixture.submittedHomeScore}
          submittedAwayScore={fixture.submittedAwayScore}
          submittedByUsername={fixture.submittedBy?.username ?? null}
          confirmedByUsername={fixture.confirmedBy?.username ?? null}
          disputedHomeScore={fixture.disputedHomeScore}
          disputedAwayScore={fixture.disputedAwayScore}
          currentUserId={session?.userId ?? null}
          notes={fixture.notes}
        />
      </div>
    </div>
  );
}
