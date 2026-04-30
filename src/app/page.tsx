import Link from "next/link";
import { PLAYERS } from "@/lib/players";

export default function HomePage() {
  // Podium order: #2 left, #1 centre (raised), #3 right.
  const [first, second, third] = PLAYERS.slice(0, 3);
  const totalMatches = PLAYERS.reduce(
    (sum, p) => sum + p.wins + p.losses + p.draws,
    0,
  );
  const totalGoals = PLAYERS.reduce((sum, p) => sum + p.goalsFor, 0);
  const totalPrize = PLAYERS.reduce((sum, p) => sum + p.prizeMoney, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-8">
      <Hero />

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        <KpiCard
          label="Matches"
          value={totalMatches.toLocaleString()}
          delta="+34 today"
          accent="neon"
        />
        <KpiCard
          label="Goals"
          value={totalGoals.toLocaleString()}
          delta="+118 today"
          accent="gold"
        />
        <KpiCard
          label="Prize Pool"
          value={`$${(totalPrize / 1000).toFixed(1)}k`}
          delta="+$420 wk"
          accent="neon"
        />
      </section>

      <section>
        <SectionHeader
          title="TOP 3 RIGHT NOW"
          action={{ href: "/rankings", label: "View Rankings" }}
        />
        <Podium first={first} second={second} third={third} />
      </section>

      <section>
        <SectionHeader title="ACTIVITY" />
        <ul className="space-y-2">
          {ACTIVITY.map((a, i) => (
            <li
              key={i}
              className="rounded-xl border border-br/70 bg-s1/60 p-3 flex items-start gap-3"
            >
              <span
                className={
                  "mt-1 h-2 w-2 rounded-full shrink-0 " +
                  (a.tone === "neon"
                    ? "bg-neon shadow-[0_0_8px_rgba(0,255,87,0.6)]"
                    : a.tone === "gold"
                      ? "bg-gold"
                      : "bg-muted")
                }
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text">{a.text}</p>
                <p className="font-mono text-[10px] text-muted mt-0.5">
                  {a.when}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-br/70 glass p-6 sm:p-10">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(600px 200px at 80% -10%, rgba(0,255,87,0.18), transparent 60%), radial-gradient(400px 200px at 0% 110%, rgba(255,184,0,0.12), transparent 60%)",
        }}
      />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neon/40 bg-neon/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neon">
          <span className="h-1.5 w-1.5 rounded-full bg-neon live-dot" />
          Season 1 · Week 12 · Live
        </span>
        <h1 className="mt-4 font-display tracking-wide text-4xl sm:text-6xl leading-[0.9] text-text">
          ZIMBABWE&apos;S
          <br />
          PRO <span className="text-neon">EA FC</span> LEAGUE
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-muted">
          Track every win, every goal, every challenger from Harare to Vic Falls.
          Star Strick FC26 is the home of Zim&apos;s competitive scene.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/rankings"
            className="inline-flex items-center justify-center h-11 rounded-lg bg-neon px-5 font-display tracking-[0.15em] hover:brightness-110 transition"
            style={{ color: "var(--bg)" }}
          >
            VIEW RANKINGS
          </Link>
          <Link
            href="/tournaments"
            className="inline-flex items-center justify-center h-11 rounded-lg border border-br/80 bg-s1/60 px-5 font-display tracking-[0.15em] text-text hover:border-neon/50 hover:text-neon transition"
          >
            VIEW CUPS
          </Link>
        </div>
      </div>
    </section>
  );
}

function Podium({
  first,
  second,
  third,
}: {
  first: (typeof PLAYERS)[number];
  second: (typeof PLAYERS)[number];
  third: (typeof PLAYERS)[number];
}) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      <PodiumCard player={second} place={2} height="md" />
      <PodiumCard player={first} place={1} height="lg" />
      <PodiumCard player={third} place={3} height="sm" />
    </div>
  );
}

function PodiumCard({
  player,
  place,
  height,
}: {
  player: (typeof PLAYERS)[number];
  place: 1 | 2 | 3;
  height: "sm" | "md" | "lg";
}) {
  const isFirst = place === 1;
  const heightCls =
    height === "lg" ? "min-h-[230px]" : height === "md" ? "min-h-[200px]" : "min-h-[185px]";
  const accent =
    place === 1 ? "text-neon" : place === 2 ? "text-text" : "text-gold";
  const placeLabel = place === 1 ? "1ST" : place === 2 ? "2ND" : "3RD";

  return (
    <div
      className={
        "relative rounded-xl border bg-s1/60 p-3 sm:p-4 flex flex-col " +
        heightCls +
        " " +
        (isFirst ? "border-neon/40 elite-glow" : "border-br/70")
      }
    >
      {isFirst && (
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full border border-neon/50 bg-bg px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-neon"
        >
          ★ Leader
        </span>
      )}
      <div className="flex items-center justify-between">
        <span
          className={
            "font-display text-3xl sm:text-4xl leading-none tabular-nums " + accent
          }
        >
          #{player.rank}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          {placeLabel}
        </span>
      </div>
      <p className="mt-3 font-display tracking-wide text-text text-base sm:text-xl truncate">
        {player.name}
      </p>
      <p className="font-mono text-[10px] sm:text-[11px] text-neon truncate">
        @{player.gamertag}
      </p>
      <div className="mt-auto pt-3">
        <div className="flex items-baseline justify-between font-mono">
          <span className="text-[10px] text-muted uppercase tracking-wider">
            Pts
          </span>
          <span className="text-text tabular-nums text-sm sm:text-base">
            {player.points.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between font-mono">
          <span className="text-[10px] text-muted uppercase tracking-wider">
            Streak
          </span>
          <span
            className={
              "tabular-nums text-sm " +
              (player.winStreak >= 5 ? "text-neon" : "text-text")
            }
          >
            {player.winStreak > 0 ? `🔥 ${player.winStreak}` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="font-display tracking-wider text-text text-2xl sm:text-3xl">
        {title}
      </h2>
      {action && (
        <Link
          href={action.href}
          className="font-mono text-[11px] uppercase tracking-wider text-neon hover:underline"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent: "neon" | "gold";
}) {
  return (
    <div className="rounded-xl border border-br/70 bg-s1/60 p-3 sm:p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p
        className={
          "mt-1 font-display text-2xl sm:text-3xl tabular-nums leading-none " +
          (accent === "neon" ? "text-neon" : "text-gold")
        }
      >
        {value}
      </p>
      <p className="mt-1.5 font-mono text-[10px] text-muted">
        <span className="text-neon">▲</span> {delta}
      </p>
    </div>
  );
}

const ACTIVITY = [
  {
    tone: "neon",
    text: "Tendai Mufaro climbed to #1 with a 3-0 win over Kudzai Sibanda.",
    when: "12 min ago",
  },
  {
    tone: "gold",
    text: "Farai Chikomo extended his win streak to 9 — leading the Mutare scene.",
    when: "1h ago",
  },
  {
    tone: "neon",
    text: "Star Strick Cup #4 qualifiers go live this Friday at 19:00 CAT.",
    when: "3h ago",
  },
  {
    tone: "muted",
    text: "Blessing Tafara joined the Pro division.",
    when: "Yesterday",
  },
] as const;
