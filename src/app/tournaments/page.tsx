import { prisma } from "@/lib/prisma";
import { Tabs } from "@/components/Tabs";

const TABS = ["Live", "Upcoming", "Past"] as const;
type Tab = (typeof TABS)[number];

function typeBadge(type: string) {
  switch (type) {
    case "KNOCKOUT":
      return (
        <span className="rounded-full bg-purple/15 border border-purple/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-purple">
          Knockout
        </span>
      );
    case "ROUND_ROBIN":
      return (
        <span className="rounded-full bg-cyan/15 border border-cyan/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-cyan">
          Round Robin
        </span>
      );
    case "GROUPS":
      return (
        <span className="rounded-full bg-orange/15 border border-orange/25 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-orange">
          Groups
        </span>
      );
    default:
      return null;
  }
}

function TournamentCard({
  tournament,
}: {
  tournament: {
    id: string;
    slug: string;
    name: string;
    city: string | null;
    prizePool: number;
    playerCount: number;
    maxPlayers: number;
    type: string;
    status: string;
    startAt: Date | null;
  };
}) {
  const href = `/tournaments/${tournament.slug}`;
  return (
    <a href={href} className="frosted-card-sm p-4 hover:border-accent/18 transition-all duration-200 block">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
          {tournament.city ?? "Online"}
        </span>
        <div className="flex items-center gap-2">
          {typeBadge(tournament.type)}
          {tournament.status === "LIVE" && (
            <span className="pill-accent inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-accent bc-pulse-red" />
              Live
            </span>
          )}
          {tournament.status === "REGISTRATION" && (
            <span className="rounded-full bg-emerald/15 border border-emerald/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-emerald">
              Open
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 font-display tracking-wide text-ink text-xl">
        {tournament.name}
      </p>
      <div className="mt-3 flex items-center gap-4 font-mono text-[11px]">
        {tournament.prizePool > 0 && (
          <span className="pill-gold rounded-full px-2 py-0.5 text-[10px]">
            ${tournament.prizePool.toLocaleString()}
          </span>
        )}
        <span className="text-muted-soft">
          {tournament.playerCount}/{tournament.maxPlayers} players
        </span>
        {tournament.startAt && (
          <>
            <span className="text-muted-soft">·</span>
            <span className="text-muted-soft">
              {new Date(tournament.startAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </>
        )}
      </div>
    </a>
  );
}

export default async function TournamentsPage() {
  const [live, registration, past] = await Promise.all([
    prisma.tournament.findMany({
      where: { status: "LIVE" },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournament.findMany({
      where: { status: "REGISTRATION" },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.tournament.findMany({
      where: { status: { in: ["COMPLETED", "DRAFT"] } },
      include: {
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mapT = (t: (typeof live)[number]) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    city: t.city,
    prizePool: t.prizePool,
    playerCount: t._count.participants,
    maxPlayers: t.maxPlayers,
    type: t.type,
    status: t.status,
    startAt: t.startAt,
  });

  const liveData = live.map(mapT);
  const upcomingData = registration.map(mapT);
  const pastData = past.map(mapT);

  function renderList(items: ReturnType<typeof mapT>[]) {
    if (items.length === 0) {
      return (
        <div className="frosted-card-sm p-8 text-center">
          <p className="text-muted-soft font-mono text-sm">No tournaments found</p>
        </div>
      );
    }
    return (
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((t) => (
          <li key={t.id}>
            <TournamentCard tournament={t} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <header className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Tournaments
          </p>
          <h1 className="cinematic-heading mt-1 text-4xl sm:text-5xl text-ink">
            CUPS &amp; EVENTS
          </h1>
        </header>
        <Tabs
          tabs={TABS}
          panels={{
            Live: renderList(liveData),
            Upcoming: renderList(upcomingData),
            Past: renderList(pastData),
          }}
        />
      </div>
    </div>
  );
}