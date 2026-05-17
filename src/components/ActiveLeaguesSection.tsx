"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type LeagueCard = {
  id: string;
  name: string;
  type: string;
  status: string;
  participantCount: number;
  maxPlayers: number;
  adminName: string;
  currentMatchday?: number;
  totalMatchdays?: number;
  slug?: string;
};

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    KNOCKOUT: { text: "text-purple", bg: "bg-purple/10", border: "border-purple/20" },
    ROUND_ROBIN: { text: "text-cyan", bg: "bg-cyan/10", border: "border-cyan/20" },
    SWISS: { text: "text-gold", bg: "bg-gold/10", border: "border-gold/20" },
    LADDER: { text: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  };
  const style = colorMap[type] ?? { text: "text-muted-soft", bg: "bg-surface", border: "border-border" };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-wider border ${style.bg} ${style.border} ${style.text}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "LIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] font-black uppercase tracking-wider">
        <span className="relative flex h-1.5 w-1.5">
          <motion.span
            className="absolute inline-flex h-full w-full rounded-full bg-accent"
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
        </span>
        Live
      </span>
    );
  }
  if (status === "REGISTRATION") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-[8px] font-black uppercase tracking-wider">
        Open
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted-soft/10 border border-muted-soft/20 text-muted-soft text-[8px] font-black uppercase tracking-wider">
      {status}
    </span>
  );
}

export function ActiveLeaguesSection({
  leagues: externalLeagues,
  onJoin,
  className = "",
}: {
  leagues?: LeagueCard[];
  onJoin?: (leagueId: string) => void;
  className?: string;
}) {
  const [internalLeagues, setInternalLeagues] = useState<LeagueCard[]>([]);

  useEffect(() => {
    if (externalLeagues) return;
    fetch("/api/leagues?limit=20")
      .then((r) => r.json())
      .then((d) => setInternalLeagues(d.data?.leagues || []))
      .catch(() => {});
  }, [externalLeagues]);

  const leagues = externalLeagues ?? internalLeagues;

  const active = useMemo(
    () => leagues.filter((l) => l.status === "LIVE" || l.status === "REGISTRATION").slice(0, 8),
    [leagues],
  );

  if (active.length === 0) return null;

  return (
    <section className={`relative py-16 sm:py-20 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 300px at 50% 50%, rgba(168,85,247,0.04), transparent 60%)" }}
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
              <span className="h-1.5 w-1.5 rounded-full bg-purple" style={{ boxShadow: "0 0 8px rgba(168,85,247,0.60)" }} />
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-purple">Active Leagues</span>
            </div>
            <h2 className="cinematic-heading text-2xl sm:text-3xl text-ink">
              League <span className="text-gradient-pink">Action</span>
            </h2>
          </div>
          <Link
            href="/leagues"
            className="text-[10px] font-bold uppercase tracking-wider text-purple hover:text-purple/80 transition-colors shrink-0"
          >
            View All &rarr;
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {active.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.35), ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="glass-v2 p-5 rounded-[20px] card-interactive h-full flex flex-col relative overflow-hidden">
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{
                    background: "radial-gradient(300px 150px at 50% 0%, rgba(168,85,247,0.06), transparent 60%)",
                  }}
                />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <TypeBadge type={l.type} />
                    <StatusBadge status={l.status} />
                  </div>

                  <h3 className="cinematic-heading text-base sm:text-lg text-ink truncate leading-tight mb-1 group-hover:text-purple transition-colors duration-200">
                    {l.name}
                  </h3>

                  <p className="text-[10px] text-muted-soft mb-3">by {l.adminName}</p>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-2 text-[11px] text-muted-soft">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      </svg>
                      <span>{l.participantCount}/{l.maxPlayers} players</span>
                    </div>

                    {l.currentMatchday !== undefined && l.totalMatchdays !== undefined && l.totalMatchdays > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] text-muted-faint">
                          <span>Matchday {l.currentMatchday}/{l.totalMatchdays}</span>
                          <span>{Math.round((l.currentMatchday / l.totalMatchdays) * 100)}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-border overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-purple to-pink"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(l.currentMatchday / l.totalMatchdays) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      {onJoin ? (
                        <button
                          type="button"
                          onClick={() => onJoin(l.id)}
                          className="btn-primary text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-[10px] h-auto min-h-0"
                        >
                          Join League
                        </button>
                      ) : (
                        <Link
                          href={`/leagues/${l.slug ?? l.id}`}
                          className="btn-primary text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-[10px] h-auto min-h-0 inline-flex items-center gap-1.5"
                        >
                          Join League
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
