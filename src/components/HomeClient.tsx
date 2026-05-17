"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";
import { motion, useScroll, useTransform } from "framer-motion";
import { StaggerContainer, NumberTicker } from "@/components/ui/PageTransition";
import { HeroSkeleton } from "@/components/ui/Skeleton";
import { PlayerDetailModal } from "@/components/PlayerDetailModal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { PLAYERS } from "@/lib/players";
import { LiveTournamentsCarousel } from "@/components/LiveTournamentsCarousel";
import { ActiveLeaguesSection } from "@/components/ActiveLeaguesSection";
import { TrendingClubs } from "@/components/TrendingClubs";
import { CommunityFeed } from "@/components/CommunityFeed";
import { JoinCTA } from "@/components/JoinCTA";
import { Particles } from "@/components/ui/Particles";
import { LiveRankingsWidget } from "@/components/LiveRankingsWidget";

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
    <div className="broadcast-theme min-h-screen">
      {/* Animated grid overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,133,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,133,0.015) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, black 20%, transparent 70%)",
        }}
      />
      <Particles count={20} color="rgba(0,255,133,0.12)" />
      <HeroSection
        totalMatches={totalMatches}
        totalGoals={totalGoals}
        playerCount={playerCount}
        clubCount={clubCount}
      />
      <CreateCTASection />
      <HowItWorksSection />
      <LiveTournamentsCarousel />
      <ActiveLeaguesSection />
      <LiveRankingsWidget />
      <TrendingClubs />
      <CommunityFeed />
      <SpotlightSection onSelect={setModalPlayerId} />
      <JoinCTA />
      {modalPlayer && (
        <PlayerDetailModal player={modalPlayer} onClose={() => setModalPlayerId(null)} allPlayers={PLAYERS} />
      )}
    </div>
  );
}

function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return pos;
}

function FloatingOrbs() {
  const mouse = useMousePosition();
  return (
    <>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute w-[500px] h-[500px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, rgba(0,230,118,0.5), transparent 70%)",
          filter: "blur(80px)",
          left: "10%",
          top: "20%",
        }}
        animate={{
          x: mouse.x * 0.02,
          y: mouse.y * 0.02,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute w-[400px] h-[400px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, rgba(34,211,238,0.4), transparent 70%)",
          filter: "blur(80px)",
          right: "15%",
          bottom: "30%",
        }}
        animate={{
          x: mouse.x * -0.015,
          y: mouse.y * -0.015,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />
    </>
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
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.4]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[90vh] flex items-center">
      <FloatingOrbs />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "conic-gradient(from 180deg at 50% 50%, rgba(0,230,118,0.08) 0deg, rgba(34,211,238,0.05) 90deg, rgba(0,255,133,0.10) 180deg, rgba(168,85,247,0.04) 270deg, rgba(0,230,118,0.08) 360deg)",
          filter: "blur(120px)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(900px 400px at 80% -10%, rgba(0,230,118,0.18), transparent 55%), radial-gradient(700px 350px at 10% 110%, rgba(168,85,247,0.06), transparent 55%), radial-gradient(500px 300px at 50% 50%, rgba(34,211,238,0.04), transparent 60%)",
        }}
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, rgba(0,230,118,0.6), transparent 70%)" }}
      />

      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="w-full">
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 mb-8 sm:mb-10"
          >
            <span className="relative flex h-3 w-3">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"
                animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" style={{ boxShadow: "0 0 12px rgba(0,255,133,0.6)" }} />
            </span>
            <span className="text-[11px] font-black tracking-[0.28em] uppercase text-accent">
              ZW &middot; Season 1 Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="break-words"
            style={{ lineHeight: 0.88 }}
          >
            <span className="cinematic-heading block text-[3.2rem] sm:text-7xl md:text-8xl lg:text-9xl text-ink">
              THE ROAD TO
            </span>
            <span className="cinematic-heading block text-[3.2rem] sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="text-gradient-accent">FC PRO</span>
            </span>
            <span className="cinematic-heading block text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl text-ink-soft mt-1 sm:mt-2">
              STARTS IN
            </span>
            <span className="cinematic-heading block text-[2.8rem] sm:text-6xl md:text-7xl lg:text-8xl">
              <span className="text-gradient-hero">ZIMBABWE.</span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 28 }}
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
            initial={{ opacity: 0, y: 30 }}
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
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-[1px] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,133,0.08), transparent 40%, transparent 60%, rgba(34,211,238,0.06))",
                }}
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
            <>
              <div className="mt-10 sm:mt-14 relative">
                <div
                  aria-hidden
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(0,255,133,0.15), rgba(34,211,238,0.1), transparent)",
                  }}
                />
                <div className="pt-6 sm:pt-8">
                  <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard label="Matches" value={totalMatches} icon="match" delay={0} />
                    <StatCard label="Goals" value={totalGoals} icon="goal" delay={0.06} />
                    <StatCard label="Players" value={playerCount} icon="player" delay={0.12} />
                    <StatCard label="Clubs" value={clubCount} icon="club" delay={0.18} />
                  </StaggerContainer>
                </div>
              </div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex justify-center mt-12"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1 text-muted-faint"
            >
              <span className="text-[8px] font-bold uppercase tracking-widest">Scroll</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>

          <div className="relative z-10 h-px mx-auto max-w-6xl mt-12" style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.20), rgba(34,211,238,0.12), rgba(168,85,247,0.08), transparent)" }} />
        </div>
      </motion.div>
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

function CreateCTASection() {
  return (
    <section className="relative py-12 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 300px at 50% 50%, rgba(0,230,118,0.03), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group"
          >
            <Link
              href="/tournaments/create"
              className="block frosted-card p-6 sm:p-8 rounded-[24px] card-interactive relative overflow-hidden h-full"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: "radial-gradient(circle, rgba(0,230,118,0.8), transparent 70%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 text-accent">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M12 5v14" /><path d="M5 12h14" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="cinematic-heading text-lg sm:text-xl text-ink">Create a Tournament</h3>
                    <p className="text-[12px] text-muted-soft mt-0.5">Set the rules, invite players</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-accent font-bold tracking-wide">
                  <span>Get Started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="group"
          >
            <Link
              href="/leagues/create"
              className="block glass-v2 p-6 sm:p-8 rounded-[24px] card-interactive relative overflow-hidden h-full"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                style={{ background: "radial-gradient(circle, rgba(168,85,247,0.8), transparent 70%)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple/10 border border-purple/20 text-purple">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                      <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="cinematic-heading text-lg sm:text-xl text-ink">Create a League</h3>
                    <p className="text-[12px] text-muted-soft mt-0.5">Build a season, crown a champion</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-purple font-bold tracking-wide">
                  <span>Get Started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Join",
      description: "Create your account and set up your profile. Connect your gamertag, pick your city, and enter the arena.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Play",
      description: "Compete in tournaments and league matches against Zimbabwe's finest EA FC players. Every match earns you ranking points.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M8 12h8" /><path d="M12 8v8" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Climb",
      description: "Rise through the divisions from Rookie to Elite. Earn your spot in the top 5 and prove you belong on the FC Pro stage.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
          <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 400px at 30% 50%, rgba(0,230,118,0.04), transparent 60%), radial-gradient(600px 300px at 70% 50%, rgba(168,85,247,0.03), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="cinematic-heading text-3xl sm:text-5xl md:text-6xl text-ink leading-[0.88]">
            How It <span className="text-gradient-accent">Works</span>
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-muted-soft max-w-md mx-auto leading-relaxed">
            Three steps to becoming a contender on the ZW ladder.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="relative group"
            >
              <div className="frosted-card p-6 sm:p-8 rounded-[24px] card-interactive h-full">
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-4 -right-4 text-[6rem] sm:text-[8rem] font-black leading-none select-none text-ink/5"
                  style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif", letterSpacing: "-0.06em" }}
                >
                  {step.number}
                </span>
                <div className="relative z-10">
                  <span className="flex items-center justify-center h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 text-accent mb-5 group-hover:bg-accent/15 transition-colors duration-300">
                    {step.icon}
                  </span>
                  <h3 className="cinematic-heading text-xl sm:text-2xl text-ink mb-3">{step.title}</h3>
                  <p className="text-[13px] sm:text-[14px] text-muted-soft leading-relaxed">{step.description}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  aria-hidden
                  className="hidden sm:block absolute top-1/3 -right-3 w-6 h-px bg-gradient-to-r from-accent/30 to-transparent"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
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
            Zimbabwe&apos;s top 5 FC players &mdash; every rank earned on local soil, every point fought for on the ZW ladder.
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
