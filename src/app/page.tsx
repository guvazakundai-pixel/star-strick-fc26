import Link from "next/link";
import { db } from "@/lib/db";
import { Top5Hero } from "@/components/Top5Hero";
import { AuthModalCTA } from "@/components/AuthModalCTA";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [matchesRes, goalsRes, playersRes, clubsRes] = await Promise.all([
    db.execute("SELECT COALESCE(SUM(matches_played),0) as v FROM player_stats"),
    db.execute("SELECT COALESCE(SUM(goals_scored),0) as v FROM player_stats"),
    db.execute("SELECT count(*) as v FROM player_stats"),
    db.execute("SELECT count(*) as v FROM clubs"),
  ]);

  const totalMatches = Number(matchesRes.rows[0].v);
  const totalGoals = Number(goalsRes.rows[0].v);
  const playerCount = Number(playersRes.rows[0].v);
  const clubCount = Number(clubsRes.rows[0].v);

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-10">
        <Hero />
        <KpiGrid
          totalMatches={totalMatches}
          totalGoals={totalGoals}
          playerCount={playerCount}
          clubCount={clubCount}
        />
        <Top5Hero />
        <CtaRow />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl glass inner-glow light-streak">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none hero-gradient-spin"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(0,255,133,0.08) 0deg, rgba(34,211,238,0.06) 120deg, rgba(168,85,247,0.06) 240deg, rgba(0,255,133,0.08) 360deg)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(600px 240px at 80% -10%, rgba(0,255,133,0.15), transparent 60%), radial-gradient(420px 220px at 0% 110%, rgba(255,184,0,0.08), transparent 60%)",
        }}
      />
      <div className="relative z-10 p-8 sm:p-12">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-accent float-glow"
        >
          <span className="bc-pulse-cta h-1.5 w-1.5 rounded-full bg-accent" />
          Season 1 · Live
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          className="bc-headline mt-5 text-[3.2rem] sm:text-7xl leading-[0.88] text-white"
        >
          Zimbabwe&apos;s<br />
          <span className="text-shimmer">Pro EA FC</span> League
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-5 max-w-xl text-sm sm:text-base text-ink-soft leading-relaxed"
        >
          Track every win, every goal, every challenger from Harare to Vic Falls. Star Strick FC26 is the home of Zim&apos;s competitive scene.
        </motion.p>
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
    <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.4 + i * 0.08,
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
  const variantStyles = {
    cyan: {
      glass: "glass-cyan",
      text: "text-cyan",
      glow: "shadow-[0_0_30px_-8px_rgba(34,211,238,0.2)]",
      gradient: "text-gradient-cyan-blue",
    },
    orange: {
      glass: "glass-orange",
      text: "text-orange",
      glow: "shadow-[0_0_30px_-8px_rgba(249,115,22,0.2)]",
      gradient: "text-gradient-orange-gold",
    },
    emerald: {
      glass: "glass-emerald",
      text: "text-emerald",
      glow: "shadow-[0_0_30px_-8px_rgba(52,211,153,0.2)]",
      gradient: "text-gradient-lime-emerald",
    },
    purple: {
      glass: "glass-purple",
      text: "text-purple",
      glow: "shadow-[0_0_30px_-8px_rgba(168,85,247,0.2)]",
      gradient: "text-gradient-pink",
    },
  };

  const s = variantStyles[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${s.glass} ${s.glow} p-4 sm:p-5 group transition-all duration-300 hover:scale-[1.02]`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className={`bc-headline mt-1.5 text-3xl sm:text-4xl tabular-nums leading-none ${s.text}`}>
        {value}
      </p>
    </div>
  );
}

function CtaRow() {
  return (
    <div className="flex flex-wrap gap-3">
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Link
          href="/rankings"
          className="inline-flex items-center justify-center h-12 rounded-xl bg-accent px-6 bc-headline text-base tracking-[0.12em] text-surface-solid hover:shadow-[0_0_30px_-6px_rgba(0,255,133,0.5)] transition-shadow"
        >
          View Rankings
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <AuthModalCTA
          tab="join"
          className="inline-flex items-center justify-center h-12 rounded-xl border border-border bg-surface-solid/50 px-6 bc-headline text-base tracking-[0.12em] text-ink hover:border-accent/40 hover:text-accent transition-colors"
        >
          Enter Rankings
        </AuthModalCTA>
      </motion.div>
    </div>
  );
}