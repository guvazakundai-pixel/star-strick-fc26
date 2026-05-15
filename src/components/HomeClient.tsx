"use client";

import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";
import { motion } from "framer-motion";

type FeaturedPlayer = {
  id: string;
  username: string;
  displayName: string | null;
  rankPosition: number;
  points: number;
  skillRating: number;
  winStreak: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  formHistory: string | null;
  clubName: string | null;
  clubTag: string | null;
};

const PLAYER_QUOTES: Record<string, string> = {
  "1": "The reigning king of Harare. Undefeated and untouchable. The mountain belongs to him.",
  "2": "One step from the throne. Ruthless precision. The challenger who will not bow.",
  "3": "Built different. The storm that rattles every bracket. Fear nothing.",
  "4": "Silent assassin. Wins without noise, climbs without mercy.",
  "5": "Hungry. Determined. Every match is a step toward immortality.",
  "6": "The wall no one can break. Defense is an art form.",
  "7": "Speed kills. The fastest hands in Zimbabwe.",
  "8": "Calculating. Cold. Every move has a purpose.",
  "9": "Born to compete. The grind never stops.",
  "10": "From the shadows to the spotlight. Watch this space.",
};

function getQuote(rank: number, username: string): string {
  return PLAYER_QUOTES[String(rank)] ?? `${username} is here to prove something. Every match writes a new chapter.`;
}

function formFromHistory(formHistory: string | null): string[] {
  if (!formHistory) return [];
  return formHistory.split("").filter((c) => c === "W" || c === "L" || c === "D").slice(-5);
}

function getRankBadge(rank: number): string {
  if (rank === 1) return "★ GOAT";
  if (rank === 2) return "★ Elite";
  if (rank === 3) return "★ Top 3";
  return `#${rank}`;
}

export function HomeClient({
  totalMatches,
  totalGoals,
  playerCount,
  clubCount,
  featuredPlayers,
}: {
  totalMatches: number;
  totalGoals: number;
  playerCount: number;
  clubCount: number;
  featuredPlayers: FeaturedPlayer[];
}) {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <HeroSection
        totalMatches={totalMatches}
        totalGoals={totalGoals}
        playerCount={playerCount}
        clubCount={clubCount}
      />
      <FeaturedPlayersSection players={featuredPlayers} />
      <BottomCTA />
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
        style={{
          background: "radial-gradient(circle, rgba(0,230,118,0.6), transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex items-center gap-2 mb-8 sm:mb-10"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="bc-pulse-cta absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          <span className="text-[11px] font-black tracking-[0.28em] uppercase text-accent">
            Season 1 · Live Now
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          className="break-words"
          style={{ lineHeight: 0.88 }}
        >
          <span className="cinematic-heading block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl text-ink">
            A Place For
          </span>
          <span className="cinematic-heading block text-[3rem] sm:text-7xl md:text-8xl lg:text-9xl">
            <span className="text-gradient-accent">The Elite.</span>
          </span>
          <span className="cinematic-heading block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl text-ink-soft mt-1 sm:mt-2">
            The Peak Of The
          </span>
          <span className="cinematic-heading block text-[2.5rem] sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-gradient-hero">Pro Mountain.</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-8 sm:mt-10 max-w-2xl text-[15px] sm:text-base text-ink-soft leading-relaxed"
        >
          Many play, but only a handful are chosen to rule. This isn&apos;t just a leaderboard;
          it is the definitive proving ground for the absolute greatest in Zimbabwe. Every match
          is a battle for legacy. Every win is a step closer to immortality. The ladder is steep,
          the competition is ruthless, and the throne only holds one GOAT.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.75, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-4 text-[13px] sm:text-sm text-muted-soft italic"
        >
          Will you watch from the shadows, or will you force them to remember your name?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="mt-10 sm:mt-12"
        >
          <div className="frosted-card p-6 sm:p-8 rounded-[28px] relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: "radial-gradient(400px 200px at 30% 50%, rgba(0,230,118,0.12), transparent 70%)",
              }}
            />
            <div className="relative z-10">
              <p className="cinematic-heading text-lg sm:text-xl text-ink tracking-tight">
                Join the ranks and start creating your legacy.
              </p>
              <p className="mt-2 text-[13px] text-muted-soft">
                Enter the rankings. Prove yourself. Climb the mountain.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <AuthModalCTA
                  tab="join"
                  className="inline-flex items-center justify-center h-12 sm:h-14 rounded-[18px] px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #00E676 0%, #00ff85 50%, #00cc6a 100%)",
                    color: "#0D0D0F",
                    boxShadow: "0 0 40px rgba(0,230,118,0.30), 0 0 80px rgba(0,230,118,0.15), 0 6px 28px rgba(0,0,0,0.25)",
                  }}
                >
                  JOIN THE RANKS
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                    <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                  </svg>
                </AuthModalCTA>
                <Link
                  href="/rankings"
                  className="inline-flex items-center justify-center h-12 sm:h-14 rounded-[18px] cta-outline px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide text-ink"
                >
                  View Rankings
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.15 }}
          className="mt-10 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        >
          <StatCard label="Matches" value={totalMatches.toLocaleString()} icon="match" />
          <StatCard label="Goals" value={totalGoals.toLocaleString()} icon="goal" />
          <StatCard label="Players" value={`${playerCount}`} icon="player" />
          <StatCard label="Clubs" value={`${clubCount}`} icon="club" />
        </motion.div>
      </div>

      <div className="relative z-10 h-px mx-auto max-w-6xl" style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.20), rgba(34,211,238,0.12), rgba(168,85,247,0.08), transparent)" }} />
    </section>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
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
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="frosted-card-sm p-5 rounded-[22px] group transition-all duration-400 hover:scale-[1.03] hover:border-accent/16"
      style={{ boxShadow: "0 0 48px -12px rgba(0,230,118,0.08)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-accent/50">{iconEl}</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className="bc-headline mt-1.5 text-3xl sm:text-4xl tabular-nums leading-none text-gradient-accent">
        {value}
      </p>
    </motion.div>
  );
}

function FeaturedPlayersSection({ players }: { players: FeaturedPlayer[] }) {
  if (players.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(800px 400px at 50% 20%, rgba(0,230,118,0.06), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">
              Featured
            </span>
          </div>
          <h2 className="cinematic-heading text-4xl sm:text-6xl md:text-7xl text-ink leading-[0.88]">
            The <span className="text-gradient-accent">Elite.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[14px] sm:text-[15px] text-muted-soft leading-relaxed">
            These are the names etched into the mountain. Every position earned. Every point fought for.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {players.map((player, i) => (
            <FeaturedPlayerCard key={player.id} player={player} index={i} />
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
            className="inline-flex items-center justify-center h-12 sm:h-13 rounded-[18px] cta-outline px-8 bc-headline text-base tracking-[0.14em] text-ink group"
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

function FeaturedPlayerCard({ player, index }: { player: FeaturedPlayer; index: number }) {
  const displayName = player.displayName || player.username;
  const form = formFromHistory(player.formHistory);
  const quote = getQuote(player.rankPosition, player.username);
  const isTop3 = player.rankPosition <= 3;
  const rankBadge = getRankBadge(player.rankPosition);

  const cardTone = isTop3
    ? {
        border: player.rankPosition === 1 ? "rgba(255,184,0,0.22)" : player.rankPosition === 2 ? "rgba(200,200,210,0.18)" : "rgba(205,127,50,0.18)",
        glow: player.rankPosition === 1 ? "0 0 60px -12px rgba(255,184,0,0.22), 0 12px 40px rgba(0,0,0,0.25)" : player.rankPosition === 2 ? "0 0 60px -12px rgba(200,200,210,0.14), 0 12px 40px rgba(0,0,0,0.25)" : "0 0 60px -12px rgba(205,127,50,0.14), 0 12px 40px rgba(0,0,0,0.25)",
      }
    : {
        border: "rgba(255,255,255,0.05)",
        glow: "0 4px 24px rgba(0,0,0,0.18)",
      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.06, 0.35), ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Link
        href={`/player/${player.username}`}
        className="block group relative overflow-hidden rounded-[24px] transition-all duration-400 hover:scale-[1.02] hover:border-accent/20"
        style={{
          background: "rgba(18, 20, 24, 0.55)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: `1px solid ${cardTone.border}`,
          boxShadow: cardTone.glow,
        }}
      >
        {isTop3 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bc-spotlight"
            style={{
              background: player.rankPosition === 1
                ? "radial-gradient(400px 200px at 15% 30%, rgba(255,184,0,0.08), transparent 65%)"
                : player.rankPosition === 2
                  ? "radial-gradient(400px 200px at 15% 30%, rgba(200,200,210,0.06), transparent 65%)"
                  : "radial-gradient(400px 200px at 15% 30%, rgba(205,127,50,0.06), transparent 65%)",
              "--spotlight-max": "0.12",
            } as React.CSSProperties}
          />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-4 right-2 select-none leading-none"
          style={{
            fontFamily: "var(--font-barlow), system-ui, sans-serif",
            fontSize: "8rem",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.06em",
            color: isTop3
              ? player.rankPosition === 1 ? "rgba(255,184,0,0.05)" : "rgba(255,255,255,0.03)"
              : "rgba(255,255,255,0.02)",
          }}
        >
          {displayName.slice(0, 6).toUpperCase()}
        </div>

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-[14px] shrink-0"
                style={{
                  background: isTop3
                    ? player.rankPosition === 1
                      ? "linear-gradient(135deg, rgba(255,184,0,0.15), rgba(255,215,94,0.08))"
                      : player.rankPosition === 2
                        ? "linear-gradient(135deg, rgba(200,200,210,0.12), rgba(255,255,255,0.05))"
                        : "linear-gradient(135deg, rgba(205,127,50,0.12), rgba(255,255,255,0.05))"
                    : "linear-gradient(135deg, rgba(0,230,118,0.08), rgba(34,211,238,0.04))",
                  border: isTop3
                    ? player.rankPosition === 1
                      ? "1px solid rgba(255,184,0,0.25)"
                      : player.rankPosition === 2
                        ? "1px solid rgba(200,200,210,0.20)"
                        : "1px solid rgba(205,127,50,0.20)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span
                  className={`cinematic-heading text-2xl sm:text-3xl leading-none ${
                    player.rankPosition === 1 ? "text-gold" : player.rankPosition === 2 ? "text-silver" : player.rankPosition === 3 ? "text-bronze" : "text-accent"
                  }`}
                >
                  {player.rankPosition}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="cinematic-heading text-xl sm:text-2xl text-ink leading-none truncate group-hover:text-accent transition-colors duration-300">
                  {displayName}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-soft">
                    @{player.username}
                  </span>
                  <span className="text-border-strong">·</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.16em] uppercase px-1.5 py-0.5 rounded-[4px]" style={{ background: "rgba(0,230,118,0.08)", color: "var(--accent)" }}>
                    ZW
                  </span>
                  {player.clubTag && (
                    <>
                      <span className="text-border-strong">·</span>
                      <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-accent/60">
                        [{player.clubTag}]
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {isTop3 && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black tracking-[0.2em] uppercase"
                style={{
                  background: player.rankPosition === 1 ? "rgba(255,184,0,0.10)" : player.rankPosition === 2 ? "rgba(200,200,210,0.08)" : "rgba(205,127,50,0.08)",
                  color: player.rankPosition === 1 ? "#ffb800" : player.rankPosition === 2 ? "#C8C8D2" : "#CD7F32",
                  border: player.rankPosition === 1 ? "1px solid rgba(255,184,0,0.20)" : player.rankPosition === 2 ? "1px solid rgba(200,200,210,0.16)" : "1px solid rgba(205,127,50,0.16)",
                }}
              >
                {rankBadge}
              </span>
            )}
          </div>

          <p className="mt-3 text-[12px] sm:text-[13px] text-muted leading-relaxed line-clamp-2 italic" style={{ lineHeight: 1.5 }}>
            &ldquo;{quote}&rdquo;
          </p>

          <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">Form</p>
                <p className="mt-1 bc-mono-score text-sm font-bold tabular-nums">
                  {form.length > 0 ? (
                    <span className="flex items-center gap-0.5">
                      {form.map((r, fi) => (
                        <span
                          key={fi}
                          className={
                            r === "W"
                              ? "text-accent"
                              : r === "L"
                                ? "text-negative"
                                : "text-muted-soft"
                          }
                        >
                          {r}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-faint">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">Points</p>
                <p className="mt-1 bc-mono-score text-sm font-bold tabular-nums text-ink">
                  {player.points.toLocaleString()}
                </p>
                <p className="text-[9px] text-muted-faint">
                  SR {Math.round(player.skillRating).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">Win Rate</p>
                <p className="mt-1 bc-mono-score text-sm font-bold tabular-nums text-ink">
                  {player.matchesPlayed > 0
                    ? `${Math.round((player.wins / player.matchesPlayed) * 100)}%`
                    : "—"}
                </p>
                <p className="text-[9px] text-muted-faint">
                  {player.wins}W {player.losses}L
                </p>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.30), transparent)" }}
          />
        </div>
      </Link>
    </motion.div>
  );
}

function BottomCTA() {
  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(800px 400px at 50% 50%, rgba(0,230,118,0.06), transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="cinematic-heading text-3xl sm:text-5xl md:text-6xl text-ink leading-[0.88]">
            The Mountain
            <br />
            <span className="text-gradient-accent">Awaits.</span>
          </h2>
          <p className="mt-5 text-[14px] sm:text-[15px] text-muted-soft leading-relaxed max-w-md mx-auto">
            Every legend was once a challenger who refused to quit. Your story starts with one match.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <AuthModalCTA
              tab="join"
              className="inline-flex items-center justify-center h-12 sm:h-14 rounded-[18px] px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #00E676 0%, #00ff85 50%, #00cc6a 100%)",
                color: "#0D0D0F",
                boxShadow: "0 0 40px rgba(0,230,118,0.30), 0 0 80px rgba(0,230,118,0.15), 0 6px 28px rgba(0,0,0,0.25)",
              }}
            >
              JOIN THE RANKS / CREATE ACCOUNT
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-5 w-5">
                <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
              </svg>
            </AuthModalCTA>
            <Link
              href="/rankings"
              className="inline-flex items-center justify-center h-12 sm:h-14 rounded-[18px] cta-outline px-8 sm:px-10 font-bold text-base sm:text-lg tracking-wide text-ink"
            >
              View Rankings
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}