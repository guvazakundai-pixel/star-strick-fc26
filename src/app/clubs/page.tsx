import { Tabs } from "@/components/Tabs";

const TABS = ["Discover", "My Club", "Top Clubs"] as const;

function Placeholder({ headline }: { headline: string }) {
  return (
    <div className="rounded-xl border border-br/70 bg-s1/60 px-4 py-12 text-center">
      <p className="font-display tracking-wider text-text text-3xl">
        {headline}
      </p>
      <p className="mt-2 max-w-md mx-auto font-mono text-xs text-muted leading-relaxed">
        The Club system — manager dashboards, lineups, match submissions,
        global club rankings, posts, chat and challenges — is queued for Phase 2.
        Backend (auth + Postgres) needed first.
      </p>
      <button className="mt-6 inline-flex h-11 items-center rounded-lg border border-br/80 bg-s2 px-5 font-display tracking-[0.15em] text-sm text-text hover:border-neon/50 hover:text-neon transition">
        NOTIFY ME
      </button>
    </div>
  );
}

export default function ClubsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
            Clubs
          </p>
          <h1 className="mt-1 font-display tracking-wider text-text text-4xl sm:text-5xl">
            THE CLUB ECOSYSTEM
          </h1>
        </div>
        <button className="hidden sm:inline-flex h-10 items-center rounded-lg border border-neon/50 bg-neon/10 px-4 font-display tracking-[0.15em] text-sm text-neon hover:bg-neon/15 transition">
          + JOIN CLUB
        </button>
      </header>

      <Tabs
        tabs={TABS}
        panels={{
          Discover: <Placeholder headline="BUILD YOUR LEGACY" />,
          "My Club": <Placeholder headline="JOIN A CLUB" />,
          "Top Clubs": <Placeholder headline="GLOBAL CLUB RANKINGS" />,
        }}
      />
    </div>
  );
}
