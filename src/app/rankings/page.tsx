import { Leaderboard } from "@/components/Leaderboard";
import { Tabs } from "@/components/Tabs";
import { PLAYERS, DIVISIONS, type Division } from "@/lib/players";

const TABS = ["Players", "Clubs", "Divisions"] as const;

export default function RankingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Season 1 · Week 12
        </p>
        <h1 className="mt-1 font-display tracking-wider text-text text-4xl sm:text-5xl">
          RANKINGS
        </h1>
      </header>
      <Tabs
        tabs={TABS}
        panels={{
          Players: <Leaderboard />,
          Clubs: <ComingSoon label="Club rankings ship in Phase 2." />,
          Divisions: <DivisionsView />,
        }}
      />
    </div>
  );
}

function DivisionsView() {
  return (
    <div className="space-y-6">
      {DIVISIONS.map((d) => {
        const players = PLAYERS.filter((p) => p.division === d).sort(
          (a, b) => a.rank - b.rank,
        );
        if (players.length === 0) return null;
        return (
          <section key={d} className="rounded-xl border border-br/70 bg-s1/60 overflow-hidden">
            <header className="px-4 py-3 border-b border-br/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DivisionDot division={d} />
                <h2 className="font-display tracking-wider text-text text-xl">
                  {d.toUpperCase()}
                </h2>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                {players.length} player{players.length === 1 ? "" : "s"}
              </span>
            </header>
            <ol className="divide-y divide-br/40">
              {players.map((p, i) => (
                <li
                  key={p.id}
                  className="px-4 py-3 flex items-center gap-3"
                >
                  <span className="font-display text-xl text-text leading-none tabular-nums w-7">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display tracking-wide text-text">
                      {p.name}
                    </p>
                    <p className="font-mono text-[10px] text-muted truncate">
                      <span className="text-neon">@{p.gamertag}</span> · {p.city}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs text-muted leading-none">PTS</p>
                    <p className="font-mono text-base tabular-nums text-text leading-tight">
                      {p.points.toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function DivisionDot({ division }: { division: Division }) {
  const cls =
    division === "Elite"
      ? "bg-neon shadow-[0_0_8px_rgba(0,255,87,0.6)]"
      : division === "Pro"
        ? "bg-gold"
        : division === "Challenger"
          ? "bg-text"
          : "bg-muted";
  return <span className={"h-2 w-2 rounded-full " + cls} />;
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-br/70 bg-s1/60 px-4 py-12 text-center">
      <p className="font-display tracking-wider text-text text-3xl">
        COMING SOON
      </p>
      <p className="mt-1 font-mono text-xs text-muted">{label}</p>
    </div>
  );
}
