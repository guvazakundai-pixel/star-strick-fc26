import Link from "next/link";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { Top5Hero } from "@/components/Top5Hero";
import { AuthModalCTA } from "@/components/AuthModalCTA";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let totalMatches = 0;
  let totalGoals = 0;
  let playerCount = 0;
  let clubCount = 0;

  try {
    const [matchesRes, goalsRes, playersRes, clubsRes] = await Promise.all([
      db.execute("SELECT COALESCE(SUM(matches_played),0) as v FROM player_stats"),
      db.execute("SELECT COALESCE(SUM(goals_scored),0) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM player_stats"),
      db.execute("SELECT count(*) as v FROM clubs"),
    ]);
    totalMatches = Number(matchesRes.rows[0].v);
    totalGoals = Number(goalsRes.rows[0].v);
    playerCount = Number(playersRes.rows[0].v);
    clubCount = Number(clubsRes.rows[0].v);
  } catch {}

  let topPlayers: Array<{ username: string; displayName: string | null; points: number; rank: number; club_tag: string | null }> = [];
  let liveClubs: Array<{ name: string; tag: string | null; memberCount: number }> = [];
  let upcomingTournaments: Array<{ name: string; slug: string; type: string; status: string }> = [];

  try {
    const topRes = await db.execute(`
      SELECT u.username, u.display_name, pr.points, pr.rank_position, c.tag as club_tag
      FROM player_rankings pr
      JOIN users u ON u.id = pr.user_id
      LEFT JOIN clubs c ON c.id = u.club_id
      ORDER BY pr.rank_position ASC
      LIMIT 5
    `);
    topPlayers = topRes.rows as any;
  } catch {}

  try {
    const clubsRes = await db.execute(`
      SELECT c.name, c.tag, COUNT(cm.id) as memberCount
      FROM clubs c
      LEFT JOIN club_members cm ON cm.club_id = c.id AND cm.status = 'APPROVED'
      GROUP BY c.id
      ORDER BY memberCount DESC
      LIMIT 4
    `);
    liveClubs = clubsRes.rows as any;
  } catch {}

  try {
    const tRes = await db.execute(`
      SELECT name, slug, type, status FROM tournaments
      WHERE status IN ('REGISTRATION', 'DRAFT')
      ORDER BY start_at ASC
      LIMIT 3
    `);
    upcomingTournaments = tRes.rows as any;
  } catch {}

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-14">
        <Hero />
        <KpiGrid
          totalMatches={totalMatches}
          totalGoals={totalGoals}
          playerCount={playerCount}
          clubCount={clubCount}
        />

        <ErrorBoundary>
          <Suspense fallback={<div className="bc-skeleton-card rounded-[28px] h-64" />}>
            <Top5Hero />
          </Suspense>
        </ErrorBoundary>

        {topPlayers.length > 0 && (
          <LiveRankingTicker players={topPlayers} />
        )}

        {liveClubs.length > 0 && (
          <TrendingClubs clubs={liveClubs} />
        )}

        {upcomingTournaments.length > 0 && (
          <UpcomingTournaments tournaments={upcomingTournaments} />
        )}

        <CtaRow />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[32px] sm:rounded-[40px] inner-glow light-streak" style={{ background: "rgba(18,20,24,0.45)" }}>
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hero-gradient-spin"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(0,255,133,0.08) 0deg, rgba(34,211,238,0.06) 100deg, rgba(168,85,247,0.05) 200deg, rgba(236,72,153,0.04) 280deg, rgba(0,255,133,0.08) 360deg)",
          filter: "blur(100px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(800px 300px at 80% -5%, rgba(0,255,133,0.16), transparent 55%), radial-gradient(600px 280px at 5% 110%, rgba(168,85,247,0.08), transparent 55%), radial-gradient(500px 250px at 50% 50%, rgba(34,211,238,0.05), transparent 65%)",
        }}
      />
      <div className="relative z-10 px-6 sm:px-10 pt-10 sm:pt-16 pb-10 sm:pb-14">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-accent/25 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-accent float-glow"
          style={{ background: "rgba(0,255,133,0.06)" }}
        >
          <span className="bc-pulse-cta h-1.5 w-1.5 rounded-full bg-accent" />
          Season 1 · Live
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="bc-headline mt-6 sm:mt-8 text-[3.2rem] sm:text-7xl md:text-8xl leading-[0.86] text-ink"
        >
          Zimbabwe&apos;s<br />
          <span className="text-gradient-championship">Pro EA FC</span> League
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-5 sm:mt-6 max-w-xl text-sm sm:text-[15px] text-ink-soft leading-relaxed"
        >
          Track every win, every goal, every challenger from Harare to Vic Falls. Star Strick FC26 is the home of Zim&apos;s competitive scene.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 sm:mt-8 flex flex-wrap gap-3"
        >
          <Link
            href="/rankings"
            className="inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] cta-primary px-7 bc-headline text-base tracking-[0.14em] text-[#0D0D0F]"
          >
            View Rankings
          </Link>
          <AuthModalCTA
            tab="join"
            className="inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] cta-outline px-7 bc-headline text-base tracking-[0.14em] text-ink"
          >
            Enter Rankings
          </AuthModalCTA>
        </motion.div>
      </div>
    </section>
  );
}

function KpiGrid({
  totalMatches,
  totalGoals,
  playerCount,
  clubCount,
}: {
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
}) {
  const cards = [
    { label: "Matches", value: totalMatches.toLocaleString(), variant: "cyan" as const },
    { label: "Goals", value: totalGoals.toLocaleString(), variant: "orange" as const },
    { label: "Players", value: `${playerCount}`, variant: "emerald" as const },
    { label: "Clubs", value: `${clubCount}`, variant: "purple" as const },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: 0.55 + i * 0.1,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <KpiCard label={card.label} value={card.value} variant={card.variant} />
        </motion.div>
      ))}
    </section>
  );
}

function KpiCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "cyan" | "orange" | "emerald" | "purple";
}) {
  const variantStyles: Record<string, { glass: string; gradient: string; glow: string; icon: React.ReactNode }> = {
    cyan: {
      glass: "glass-cyan",
      gradient: "text-gradient-cyan-blue",
      glow: "shadow-[0_0_60px_-12px_rgba(34,211,238,0.20)]",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-8" /><path d="M22 20H2" />
        </svg>
      ),
    },
    orange: {
      glass: "glass-orange",
      gradient: "text-gradient-orange-gold",
      glow: "shadow-[0_0_60px_-12px_rgba(249,115,22,0.20)]",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    emerald: {
      glass: "glass-emerald",
      gradient: "text-gradient-lime-emerald",
      glow: "shadow-[0_0_60px_-12px_rgba(52,211,153,0.20)]",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    purple: {
      glass: "glass-purple",
      gradient: "text-gradient-pink",
      glow: "shadow-[0_0_60px_-12px_rgba(168,85,247,0.20)]",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
        </svg>
      ),
    },
  };

  const s = variantStyles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-[24px] ${s.glass} ${s.glow} p-5 sm:p-6 group transition-all duration-400 hover:scale-[1.03] hover:shadow-[0_0_80px_-16px_var(--glow-color,rgba(0,255,133,0.15))]`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-500"
        style={{ background: `radial-gradient(circle, currentColor, transparent 70%)` }}
      />
      <div className="flex items-start justify-between mb-3">
        <span className={`${variant === "cyan" ? "text-cyan" : variant === "orange" ? "text-orange" : variant === "emerald" ? "text-emerald" : "text-purple"} opacity-50`}>{s.icon}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={`bc-headline mt-1.5 text-3xl sm:text-4xl tabular-nums leading-none ${s.gradient}`}>
        {value}
      </p>
    </div>
  );
}

function LiveRankingTicker({ players }: { players: Array<{ username: string; displayName: string | null; points: number; rank: number; club_tag: string | null }> }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
        <h2 className="bc-headline text-xl text-ink">Live Rankings</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto bc-no-scrollbar pb-2">
        {players.map((p, i) => (
          <motion.div
            key={p.username}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Link
              href={`/player/${p.username}`}
              className="block frosted-card-sm p-4 rounded-[20px] min-w-[180px] hover:border-accent/16 transition-all duration-300 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="bc-headline text-2xl text-accent tabular-nums">{p.rank}</span>
                {p.club_tag && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-accent/50">[{p.club_tag}]</span>
                )}
              </div>
              <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors duration-300 truncate">
                {p.displayName || p.username}
              </p>
              <p className="bc-mono-score text-xs text-muted-soft mt-0.5">{p.points.toLocaleString()} pts</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TrendingClubs({ clubs }: { clubs: Array<{ name: string; tag: string | null; memberCount: number }> }) {
  return (
    <section className="space-y-3">
      <h2 className="bc-headline text-xl text-ink">Trending Clubs</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {clubs.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Link
              href={`/club/${c.tag ?? c.name.toLowerCase().replace(/\s+/g, "-")}`}
              className="block frosted-card-sm p-4 rounded-[20px] hover:border-accent/16 transition-all duration-300 group"
            >
              <div className="h-10 w-10 rounded-[12px] border border-white/[0.06] flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))" }}>
                <span className="bc-headline text-lg text-accent">{c.tag?.[0] ?? c.name[0]}</span>
              </div>
              <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors duration-300 truncate">{c.name}</p>
              <p className="text-[11px] text-muted-soft mt-0.5">{c.memberCount} member{c.memberCount !== 1 ? "s" : ""}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function UpcomingTournaments({ tournaments }: { tournaments: Array<{ name: string; slug: string; type: string; status: string }> }) {
  const typeColors: Record<string, { bg: string; text: string }> = {
    KNOCKOUT: { bg: "rgba(168,85,247,0.08)", text: "text-purple" },
    ROUND_ROBIN: { bg: "rgba(34,211,238,0.08)", text: "text-cyan" },
    GROUPS: { bg: "rgba(249,115,22,0.08)", text: "text-orange" },
  };

  return (
    <section className="space-y-3">
      <h2 className="bc-headline text-xl text-ink">Upcoming Tournaments</h2>
      <div className="space-y-2">
        {tournaments.map((t) => {
          const tc = typeColors[t.type] || typeColors.KNOCKOUT;
          return (
            <Link
              key={t.slug}
              href={`/tournaments/${t.slug}`}
              className="block frosted-card-sm p-4 rounded-[20px] hover:border-accent/16 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors duration-300">{t.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider rounded-[4px] px-1.5 py-0.5" style={{ background: tc.bg }}>{t.type}</span>
                    <span className="text-[10px] text-muted-soft font-mono">{t.status}</span>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-muted-soft group-hover:text-accent transition-colors shrink-0">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function CtaRow() {
  return (
    <div className="flex flex-wrap gap-3">
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <Link
          href="/rankings"
          className="inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] cta-primary px-7 bc-headline text-base tracking-[0.14em] text-[#0D0D0F]"
        >
          View Rankings
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
      >
        <AuthModalCTA
          tab="join"
          className="inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] cta-outline px-7 bc-headline text-base tracking-[0.14em] text-ink"
        >
          Enter Rankings
        </AuthModalCTA>
      </motion.div>
    </div>
  );
}