"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/lib/session-client";

interface MatchPlayer {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface MatchItem {
  id: string;
  score1: number;
  score2: number;
  status: string;
  statusRaw: string;
  isDisputed: boolean;
  createdAt: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  submittedById: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING_ACCEPTANCE: { label: "Awaiting", color: "text-gold", bg: "bg-gold/8 border-gold/20", icon: "⏳" },
  ACTIVE: { label: "Active", color: "text-accent", bg: "bg-accent/8 border-accent/20", icon: "⚡" },
  SCORE_SUBMITTED: { label: "Submitted", color: "text-cyan", bg: "bg-cyan/8 border-cyan/20", icon: "📝" },
  PENDING_VERIFICATION: { label: "Verifying", color: "text-cyan", bg: "bg-cyan/8 border-cyan/20", icon: "🔄" },
  COMPLETED: { label: "Completed", color: "text-emerald", bg: "bg-emerald/8 border-emerald/20", icon: "✓" },
  CONFIRMED: { label: "Confirmed", color: "text-cyan", bg: "bg-cyan/8 border-cyan/20", icon: "✓" },
  APPROVED: { label: "Approved", color: "text-accent", bg: "bg-accent/8 border-accent/20", icon: "🏆" },
  DISPUTED: { label: "Disputed", color: "text-negative", bg: "bg-negative/8 border-negative/20", icon: "⚠" },
  CANCELLED: { label: "Cancelled", color: "text-muted-soft", bg: "bg-surface border-border", icon: "✕" },
  EXPIRED: { label: "Expired", color: "text-muted-soft", bg: "bg-surface border-border", icon: "⌛" },
  AUTO_FORFEIT: { label: "Forfeit", color: "text-negative/80", bg: "bg-negative/5 border-negative/15", icon: "🚩" },
};

function statusMeta(s: string) {
  return STATUS_META[s] ?? { label: s, color: "text-muted-soft", bg: "bg-surface border-border", icon: "•" };
}

export function MatchHistoryClient() {
  const session = useSession();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams({ limit: "50" });
    if (session?.userId) params.set("player", session.userId);
    fetch(`/api/matches?${params}`)
      .then(r => r.json())
      .then(d => setMatches(d.matches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.userId]);

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "active") return matches.filter(m => ["PENDING_ACCEPTANCE", "ACTIVE", "SCORE_SUBMITTED", "PENDING_VERIFICATION"].includes(m.statusRaw));
    if (filter === "completed") return matches.filter(m => ["COMPLETED", "CONFIRMED", "APPROVED"].includes(m.statusRaw));
    if (filter === "disputed") return matches.filter(m => m.isDisputed || m.statusRaw === "DISPUTED");
    return matches;
  }, [matches, filter]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="frosted-card-sm p-5 animate-pulse">
            <div className="h-5 w-3/4 rounded bg-bg-highlight/50" />
          </div>
        ))}
      </div>
    );
  }

  const tabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "disputed", label: "Disputed" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto bc-no-scrollbar pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`shrink-0 px-3.5 h-9 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 border ${
              filter === t.id
                ? "bg-accent/15 text-accent border-accent/25"
                : "bg-bg-elevated/50 text-muted-soft border-border-faint hover:text-ink hover:border-border-strong"
            }`}
          >
            {t.label}
            {t.id === "active" && filtered.length > 0 && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-accent inline-block animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="frosted-card p-10 text-center">
          <span className="text-4xl block mb-3 opacity-40">🎮</span>
          <p className="text-muted-soft text-sm">No matches found</p>
          <Link href="/matches/find" className="inline-flex mt-4 h-10 rounded-[14px] cta-primary px-5 text-sm font-bold tracking-wider items-center justify-center">
            Find a Match
          </Link>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {filtered.map((match, idx) => {
              const meta = statusMeta(match.statusRaw);
              const p1Name = match.player1.displayName || match.player1.username;
              const p2Name = match.player2.displayName || match.player2.username;
              const isP1Win = match.winnerId === match.player1.id;
              const isP2Win = match.winnerId === match.player2.id;
              const isDraw = !match.winnerId && ["COMPLETED", "CONFIRMED", "APPROVED"].includes(match.statusRaw);
              const isLive = ["ACTIVE", "SCORE_SUBMITTED", "PENDING_VERIFICATION"].includes(match.statusRaw);
              const showReveal = match.statusRaw === "PENDING_ACCEPTANCE";

              return (
                <motion.div
                  key={match.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.03 }}
                >
                  <Link
                    href={`/matches/${match.id}`}
                    className={`block frosted-card-sm p-4 sm:p-5 rounded-[18px] transition-all duration-200 group relative overflow-hidden ${
                      isLive ? "border-accent/20" : match.isDisputed ? "border-negative/15" : "hover:border-accent/15"
                    }`}
                  >
                    {isLive && (
                      <span className="absolute top-3 right-3 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-accent">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" />
                        LIVE
                      </span>
                    )}

                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1 text-right">
                        <p className={`text-sm font-bold truncate ${isP1Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors`}>
                          {p1Name}
                        </p>
                        <p className="font-mono text-[10px] text-muted-soft">@{match.player1.username}</p>
                      </div>

                      <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[64px]">
                        <div className="flex items-center gap-1.5">
                          <span className={`bc-headline text-xl tabular-nums ${isP1Win ? "text-accent" : "text-ink"}`}>
                            {match.score1}
                          </span>
                          <span className="text-muted-faint text-[11px] font-mono">:</span>
                          <span className={`bc-headline text-xl tabular-nums ${isP2Win ? "text-accent" : "text-ink"}`}>
                            {match.score2}
                          </span>
                        </div>
                        <span className={`text-[8px] font-black tracking-[0.18em] uppercase ${meta.color}`}>
                          {meta.label}
                        </span>
                        {isDraw && <span className="text-[8px] font-bold text-gold">Draw</span>}
                        {match.isDisputed && <span className="text-[8px] font-bold text-negative">⚠ Disputed</span>}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isP2Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors`}>
                          {p2Name}
                        </p>
                        <p className="font-mono text-[10px] text-muted-soft">@{match.player2.username}</p>
                      </div>

                      {showReveal && (
                        <div className="shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-accent">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-3">
                      <span className="font-mono text-[9px] text-muted-faint">
                        {new Date(match.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      {session && match.submittedById === session.userId && (
                        <span className="text-[8px] font-bold uppercase tracking-wider text-muted-soft">You submitted</span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
