import { Leaderboard } from "@/components/Leaderboard";
import { Tabs } from "@/components/Tabs";

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
          Divisions: <ComingSoon label="Per-division boards coming soon." />,
        }}
      />
    </div>
  );
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
