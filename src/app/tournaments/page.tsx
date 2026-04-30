import { Tabs } from "@/components/Tabs";

const TABS = ["Live", "Upcoming", "Past"] as const;
type Tab = (typeof TABS)[number];

const FIXTURES: Record<
  Tab,
  ReadonlyArray<{
    id: string;
    name: string;
    city: string;
    prize: number;
    players: number;
  }>
> = {
  Live: [
    {
      id: "t1",
      name: "Star Strick Cup #4 — Quarterfinals",
      city: "Harare",
      prize: 1500,
      players: 8,
    },
  ],
  Upcoming: [
    { id: "t2", name: "Bulawayo Open", city: "Bulawayo", prize: 800, players: 32 },
    { id: "t3", name: "Mutare Showdown", city: "Mutare", prize: 600, players: 16 },
  ],
  Past: [
    { id: "t4", name: "Star Strick Cup #3", city: "Harare", prize: 1200, players: 32 },
    { id: "t5", name: "Gweru Invitational", city: "Gweru", prize: 400, players: 16 },
  ],
};

function FixtureList({ tab }: { tab: Tab }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {FIXTURES[tab].map((f) => (
        <li
          key={f.id}
          className="rounded-xl border border-br/70 bg-s1/60 p-4 hover:border-neon/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              {f.city}
            </span>
            {tab === "Live" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-neon">
                <span className="h-1.5 w-1.5 rounded-full bg-neon live-dot" />
                Live
              </span>
            )}
          </div>
          <p className="mt-2 font-display tracking-wide text-text text-xl">
            {f.name}
          </p>
          <div className="mt-3 flex items-center gap-4 font-mono text-[11px]">
            <span className="text-gold">${f.prize.toLocaleString()}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{f.players} players</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function TournamentsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Tournaments
        </p>
        <h1 className="mt-1 font-display tracking-wider text-text text-4xl sm:text-5xl">
          CUPS &amp; EVENTS
        </h1>
      </header>
      <Tabs
        tabs={TABS}
        panels={{
          Live: <FixtureList tab="Live" />,
          Upcoming: <FixtureList tab="Upcoming" />,
          Past: <FixtureList tab="Past" />,
        }}
      />
    </div>
  );
}
