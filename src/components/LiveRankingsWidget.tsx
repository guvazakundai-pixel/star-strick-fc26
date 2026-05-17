"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type RankingEntry = {
  id: string;
  rankPosition: number;
  prevPosition: number | null;
  rankChange: number;
  points: number;
  finalScore: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    playerStats: {
      wins: number;
      losses: number;
      draws: number;
      goalsScored: number;
      skillRating: number;
    } | null;
  };
};

function RankChangeIcon({ change }: { change: number }) {
  if (change > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-accent text-[9px] font-bold tabular-nums">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <path d="M12 5l7 7h-5v7h-4v-7H5l7-7z" />
        </svg>
        {change}
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-negative text-[9px] font-bold tabular-nums">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <path d="M12 19l-7-7h5V5h4v7h5l-7 7z" />
        </svg>
        {Math.abs(change)}
      </span>
    );
  }
  return (
    <span className="text-muted-faint text-[9px] font-bold tabular-nums">
      —
    </span>
  );
}

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="text-gold" style={{ filter: "drop-shadow(0 0 6px rgba(255,184,0,0.4))" }}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="text-muted-soft">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="text-gold/60">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="text-muted-faint font-mono text-[11px] tabular-nums w-4 text-right">
      {rank}
    </span>
  );
}

export function LiveRankingsWidget({
  rankings: externalRankings,
  className = "",
}: {
  rankings?: RankingEntry[];
  className?: string;
}) {
  const [internalRankings, setInternalRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalRankings) {
      setLoading(false);
      return;
    }
    fetch("/api/rankings/top?limit=10")
      .then((r) => r.json())
      .then((d) => {
        setInternalRankings(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [externalRankings]);

  const rankings = externalRankings ?? internalRankings;

  if (loading) {
    return (
      <section className={`relative py-16 sm:py-20 ${className}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="frosted-card-sm rounded-[24px] p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-4 rounded bg-white/5" />
                <div className="h-8 w-8 rounded-[10px] bg-white/5" />
                <div className="flex-1 h-4 rounded bg-white/5" />
                <div className="h-4 w-12 rounded bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rankings.length === 0) return null;

  return (
    <section className={`relative py-16 sm:py-20 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 400px at 50% 30%, rgba(0,230,118,0.04), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <motion.span
                  className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.75, 0, 0.75] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">
                Live Rankings
              </span>
            </div>
            <h2 className="cinematic-heading text-2xl sm:text-3xl text-ink">
              ZW <span className="text-gradient-accent">Leaderboard</span>
            </h2>
          </div>
          <Link
            href="/rankings"
            className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors shrink-0"
          >
            View All &rarr;
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="frosted-card-sm rounded-[24px] overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center px-5 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint border-b border-border-faint">
            <span className="w-10">Rank</span>
            <span className="flex-1">Player</span>
            <span className="w-14 text-center">W/L</span>
            <span className="w-16 text-center">Rating</span>
            <span className="w-14 text-center hidden sm:block">Change</span>
          </div>
          <div className="divide-y divide-border-faint">
            {rankings.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                className="flex items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-10 flex items-center">
                  <MedalIcon rank={entry.rankPosition} />
                </div>
                <div className="flex-1 flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-8 w-8 rounded-[10px] shrink-0 grid place-items-center text-[11px] font-bold"
                    style={{
                      background: "rgba(0,255,133,0.06)",
                      border: "1px solid rgba(0,255,133,0.1)",
                      color: "var(--accent)",
                    }}
                  >
                    {(entry.user.displayName || entry.user.username)[0].toUpperCase()}
                  </div>
                  <Link
                    href={`/player/${entry.user.username}`}
                    className="text-sm font-bold text-ink truncate hover:text-accent transition-colors"
                  >
                    {entry.user.displayName || entry.user.username}
                  </Link>
                </div>
                <div className="w-14 text-center font-mono text-[11px] text-muted-soft tabular-nums">
                  {entry.user.playerStats ? (
                    <>
                      {entry.user.playerStats.wins}/
                      {entry.user.playerStats.losses}
                    </>
                  ) : (
                    "—"
                  )}
                </div>
                <div className="w-16 text-center font-mono text-[11px] text-accent font-bold tabular-nums">
                  {Math.round(entry.finalScore).toLocaleString()}
                </div>
                <div className="w-14 text-center hidden sm:flex justify-center">
                  <RankChangeIcon change={entry.rankChange} />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
