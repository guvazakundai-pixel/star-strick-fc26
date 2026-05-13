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
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-14">
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
  const variantStyles = {
    cyan: {
      glass: "glass-cyan",
      text: "text-cyan",
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
      text: "text-orange",
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
      text: "text-emerald",
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
      text: "text-purple",
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
        <span className={`${s.text} opacity-50`}>{s.icon}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={`bc-headline mt-1.5 text-3xl sm:text-4xl tabular-nums leading-none ${s.gradient}`}>
        {value}
      </p>
    </div>
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