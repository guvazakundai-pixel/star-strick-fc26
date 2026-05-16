"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";
import { motion } from "framer-motion";
import { StaggerContainer, NumberTicker } from "@/components/ui/PageTransition";
import { HeroSkeleton } from "@/components/ui/Skeleton";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { PLAYERS } from "@/lib/players";

function safeNumber(val: number | undefined | null, fallback: number = 0): number {
  if (val === null || val === undefined || !Number.isFinite(val)) return fallback;
  return val;
}

function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

export function HomeClient({
  totalMatches: totalMatchesRaw,
  totalGoals: totalGoalsRaw,
  playerCount: playerCountRaw,
  clubCount: clubCountRaw,
}: {
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
}) {
  const mounted = useMounted();
  const [modalPlayerId, setModalPlayerId] = useState<string | null>(null);

  const totalMatches = safeNumber(totalMatchesRaw, 0);
  const totalGoals = safeNumber(totalGoalsRaw, 0);
  const playerCount = safeNumber(playerCountRaw, 0);
  const clubCount = safeNumber(clubCountRaw, 0);

  const modalPlayer = useMemo(
    () => (modalPlayerId ? PLAYERS.find((p) => p.id === modalPlayerId) ?? null : null),
    [modalPlayerId],
  );

  if (!mounted) {
    return <HeroSkeleton />;
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <HeroSection
        totalMatches={totalMatches}
        totalGoals={totalGoals}
        playerCount={playerCount}
        clubCount={clubCount}
      />
      <SpotlightSection onSelect={setModalPlayerId} />
      <BottomCTA />
      {modalPlayer && (
        <PlayerDetailModal player={modalPlayer} onClose={() => setModalPlayerId(null)} allPlayers={PLAYERS} />
      )}
    </div>
  );
}

function HeroSection({
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
  const hasStats = totalMatches > 0 || totalGoals > 0 || playerCount > 0 || clubCount > 0;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hero-gradient-spin"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, rgba(0,230,118,0.08) 0deg, rgba(34,211,238,0.05) 90deg, rgba(0,255,133,0.10) 180deg, rgba(168,85,247,0.04) 270deg, rgba(0,230,118,0.08) 360deg)",
          filter: "blur(120px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 400px at 80% -10%, rgba(0,230,118,0.18), transparent 55%), radial-gradient(700px 350px at 10% 110%, rgba(168,85,247,0.06), transparent 55%), radial-gradient(500px 300px at 50% 50%, rgba(34,211,238,0.04), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, rgba(0,230,118,0.6), transparent 70%)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 mb-8 sm:mb-10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="bc-pulse-cta absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <span className="text-[11px] font-black tracking-[0.28em] uppercase text-accent">
            ZW · Season 1 Live
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="break-words"
          style={{ lineHeight: 0.88 }}
        >
          <span className="cinematic-heading block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl text-ink">
            THE ROAD TO
          </span>
          <span className="cinematic-heading block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="text-gradient-accent">FC PRO</span>
          </span>
          <span className="cinematic-heading block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl text-ink-soft mt-1 sm:mt-2">
            STARTS IN
          </span>
          <span className="cinematic-heading block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-gradient-hero">ZIMBABWE.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 sm:mt-10 max-w-2xl text-[15px] sm:text-base text-ink-soft leading-relaxed"
        >
          This is Zimbabwe&apos;s definitive ladder for EA FC. From Harare to Bulawayo, every match
          is a battle for local supremacy. Earn your spot among the nation&apos;s top tier, climb the
          ZW rankings, and prove you belong at the summit. The throne only holds one.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 text-[13px] sm:text-sm text-muted-soft italic"
        >
          Are you ready to dominate the ZW scene, or will you be left behind?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="mt-10 sm:mt-12"
        >
          <div className="frosted-card p-6 sm:p-8 rounded-[28px] relative overflow-hidden card-interactive card-glow-line">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: "radial-gradient(400px 200px at 30% 50%, rgba(0,230,118,0.12), transparent 70%)" }}
            />
            <div className="relative z-10">
              <p className="cinematic-heading text-lg sm:text-xl text-ink tracking-tight">
                Claim Your Rank. Rule Zimbabwe.
              </p>
              <p className="mt-2 text-[13px] text-muted-soft">
                Create your account and begin your climb up the ZW leaderboard.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <AuthModalCTA
                  tab="join"
                  className="btn-primary inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide"
                >
                  JOIN THE RANKS
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                    <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                  </svg>
                </AuthModalCTA>
                <Link
                  href="/rankings"
                  className="btn-ghost inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide text-ink"
                >
                  View Rankings
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {hasStats && (
          <StaggerContainer className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4" initial="hidden" animate="visible">
            <StatCard label="Matches" value={totalMatches} icon="match" delay={0} />
            <StatCard label="Goals" value={totalGoals} icon="goal" delay={0.06} />
            <StatCard label="Players" value={playerCount} icon="player" delay={0.12} />
            <StatCard label="Clubs" value={clubCount} icon="club" delay={0.18} />
          </StaggerContainer>
        )}

        <div className="relative z-10 h-px mx-auto max-w-6xl mt-12" style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.20), rgba(34,211,238,0.12), rgba(168,85,247,0.08), transparent)" }} />
      </div>
    </section>
  );
}

function StatCard({ label, value, icon, delay = 0 }: { label: string; value: number; icon: string; delay?: number }) {
  const iconEl = (() => {
    switch (icon) {
      case "match":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
          </svg>
        );
      case "goal":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
        );
      case "player":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case "club":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
          </svg>
        );
      default:
        return null;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 260, damping: 24, mass: 0.8 }}
      className="frosted-card-sm p-5 rounded-[22px] card-interactive card-glow-line neon-glow-accent"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-accent/50">{iconEl}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className="bc-headline mt-1.5 text-3xl sm:text-4xl tabular-nums leading-none text-gradient-accent">
        <NumberTicker value={value} />
      </p>
    </motion.div>
  );
}

function SpotlightSection({ onSelect }: { onSelect: (id: string) => void }) {
  const spotlightPlayers = useMemo(() => {
    return PLAYERS.filter((p) => p.rank <= 5);
  }, []);

  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 400px at 50% 20%, rgba(0,230,118,0.06), transparent 60%)" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">Spotlight</span>
          </div>
          <h2 className="cinematic-heading text-4xl sm:text-6xl md:text-7xl text-ink leading-[0.88]">
            The <span className="text-gradient-accent">Elite.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[14px] sm:text-[15px] text-muted-soft leading-relaxed">
            Zimbabwe&apos;s top 5 FC players — every rank earned on local soil, every point fought for on the ZW ladder.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 auto-rows-fr">
          {spotlightPlayers.map((player, i) => (
            <SpotlightCard key={player.id} player={player} index={i} onSelect={onSelect} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 sm:mt-14 text-center"
        >
          <Link
            href="/rankings"
            className="btn-ghost inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] px-8 bc-headline text-base tracking-[0.14em] text-ink group"
          >
            View Full Rankings
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 400px at 50% 50%, rgba(0,230,118,0.06), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="cinematic-heading text-3xl sm:text-5xl md:text-6xl text-ink leading-[0.88]">
            The ZW Mountain
            <br />
            <span className="text-gradient-accent">Awaits.</span>
          </h2>
          <p className="mt-5 text-[14px] sm:text-[15px] text-muted-soft leading-relaxed max-w-md mx-auto">
            Every legend in Zimbabwe started as a challenger who refused to quit. The climb to FC Pro begins with one match on home soil.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AuthModalCTA
              tab="join"
              className="btn-primary inline-flex items-center justify-center h-12 sm:h-14 px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide"
              style={{ boxShadow: "0 0 40px rgba(0,230,118,0.30), 0 0 80px rgba(0,230,118,0.15), 0 6px 28px rgba(0,0,0,0.25)" }}
            >
              JOIN THE RANKS / CREATE ACCOUNT
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
              </svg>
            </AuthModalCTA>
            <Link
              href="/rankings"
              className="btn-ghost inline-flex items-center justify-center h-12 sm:h-14 rounded-[18px] px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide text-ink"
            >
              View Rankings
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
