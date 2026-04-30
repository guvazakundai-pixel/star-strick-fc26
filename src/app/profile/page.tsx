import { Tabs } from "@/components/Tabs";

const TABS = ["Stats", "Matches", "Achievements"] as const;

function Placeholder({ headline }: { headline: string }) {
  return (
    <div className="rounded-xl border border-br/70 bg-s1/60 px-4 py-12 text-center">
      <p className="font-display tracking-wider text-text text-3xl">
        {headline}
      </p>
      <p className="mt-1 font-mono text-xs text-muted">
        Personal stats, match history and trophies arrive after sign-in lands.
      </p>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <header className="mb-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
          Profile
        </p>
        <h1 className="mt-1 font-display tracking-wider text-text text-4xl sm:text-5xl">
          MY JOURNEY
        </h1>
      </header>

      <section className="mb-5 rounded-2xl border border-br/70 glass p-5 flex items-center gap-4">
        <div className="h-16 w-16 grid place-items-center rounded-xl border border-br bg-s2">
          <span className="font-display text-2xl text-muted">?</span>
        </div>
        <div>
          <p className="font-display tracking-wide text-text text-2xl leading-none">
            SIGN IN TO PLAY
          </p>
          <p className="mt-1 font-mono text-xs text-muted">
            Authentication ships in Phase 2 — for now this is a preview.
          </p>
        </div>
      </section>

      <Tabs
        tabs={TABS}
        panels={{
          Stats: <Placeholder headline="STATS" />,
          Matches: <Placeholder headline="MATCHES" />,
          Achievements: <Placeholder headline="ACHIEVEMENTS" />,
        }}
      />
    </div>
  );
}
