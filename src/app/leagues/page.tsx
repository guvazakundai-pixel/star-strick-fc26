import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

function formatBadge(format: string) {
  const map: Record<string, string> = {
    ROUND_ROBIN: "Round Robin",
    DOUBLE_RR: "Double RR",
    LADDER: "Ladder",
    GROUPS: "Groups",
  };
  return (
    <span className="rounded-full bg-cyan/15 border border-cyan/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan">
      {map[format] ?? format}
    </span>
  );
}

function statusPill(status: string) {
  if (status === "LIVE") {
    return (
      <span className="pill-accent inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-accent bc-pulse-red" />
        Live
      </span>
    );
  }
  if (status === "REGISTRATION") {
    return (
      <span className="rounded-full bg-emerald/15 border border-emerald/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald">
        Open
      </span>
    );
  }
  if (status === "DRAFT") {
    return (
      <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-soft">
        Draft
      </span>
    );
  }
  return (
    <span className="rounded-full bg-surface-2 border border-border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-soft">
      {status}
    </span>
  );
}

export default async function LeaguesPage() {
  const [session, leagues] = await Promise.all([
    getSession(),
    prisma.league.findMany({
      where: { visibility: "PUBLIC" },
      include: {
        owner: { select: { username: true, displayName: true } },
        _count: { select: { members: true, seasons: true } },
        seasons: {
          orderBy: { seasonNumber: "desc" },
          take: 1,
          select: { seasonNumber: true, phase: true },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="cinematic-heading text-3xl sm:text-4xl text-ink">Leagues</h1>
            <p className="text-muted-soft text-sm mt-1">
              Run your own EAFC competitive league. Create one, invite players, play matches, climb the table.
            </p>
          </div>
          {session ? (
            <Link
              href="/leagues/create"
              className="rounded-full bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wider text-bg hover:opacity-90 transition-opacity"
            >
              + Create League
            </Link>
          ) : (
            <Link
              href="/login?next=/leagues/create"
              className="rounded-full border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-muted-soft hover:text-ink transition-colors"
            >
              Log in to create
            </Link>
          )}
        </header>

        {leagues.length === 0 ? (
          <div className="frosted-card-sm p-8 text-center">
            <p className="text-muted-soft font-mono text-sm">
              No leagues yet. Be the first to start one.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((l) => (
              <Link
                key={l.id}
                href={`/leagues/${l.slug}`}
                className="frosted-card-sm p-4 hover:border-accent/18 transition-all duration-200 block"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
                    {l.region}
                  </span>
                  <div className="flex items-center gap-2">
                    {formatBadge(l.format)}
                    {statusPill(l.status)}
                  </div>
                </div>
                <p className="mt-2 font-display tracking-wide text-ink text-xl">{l.name}</p>
                {l.description && (
                  <p className="mt-1 text-xs text-muted-soft line-clamp-2">{l.description}</p>
                )}
                <div className="mt-3 flex items-center gap-3 font-mono text-[11px] text-muted-soft">
                  <span>{l._count.members}/{l.maxPlayers} members</span>
                  <span>·</span>
                  <span>
                    {l.seasons[0]
                      ? `Season ${l.seasons[0].seasonNumber} ${l.seasons[0].phase.toLowerCase()}`
                      : "No season yet"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
