"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface DisputeMatch {
  id: string;
  player1: { id: string; username: string; displayName: string | null };
  player2: { id: string; username: string; displayName: string | null };
  score1: number;
  score2: number;
  status: string;
  statusRaw: string;
}

interface DisputeItem {
  id: string;
  matchId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; username: string; displayName: string | null };
  match: DisputeMatch | null;
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<Record<string, "idle" | "resolving" | "done">>({});

  const fetchDisputes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/disputes");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDisputes(data.disputes ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  const handleResolve = useCallback(async (matchId: string, action: "overturn" | "flag_user" | "cancel") => {
    setResolution((prev) => ({ ...prev, [matchId]: "resolving" }));
    try {
      const res = await fetch("/api/admin/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });
      if (res.ok) {
        setDisputes((prev) => prev.filter((d) => d.matchId !== matchId));
      }
    } catch {
    } finally {
      setResolution((prev) => ({ ...prev, [matchId]: "idle" }));
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="frosted-card-sm p-5 animate-pulse">
            <div className="h-5 w-2/3 rounded bg-bg-highlight/50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dispute Queue</h1>
        <p className="text-muted-soft text-sm mt-1">
          {disputes.length} open dispute{disputes.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="frosted-card p-10 text-center">
          <span className="text-5xl block mb-4 opacity-40">🛡️</span>
          <p className="text-muted-soft text-sm">No open disputes. All clear.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {disputes.map((dispute) => {
              const p1Name = dispute.match?.player1.displayName || dispute.match?.player1.username || "?";
              const p2Name = dispute.match?.player2.displayName || dispute.match?.player2.username || "?";

              return (
                <motion.div
                  key={dispute.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="frosted-card rounded-[20px] p-5 border border-negative/15"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-negative">⚠ Dispute</span>
                        <span className="text-[9px] font-mono text-muted-faint">
                          {new Date(dispute.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-ink">
                        {p1Name} vs {p2Name}
                      </p>
                      {dispute.match && (
                        <p className="text-[11px] text-muted-soft mt-0.5">
                          Score: {dispute.match.score1} - {dispute.match.score2}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/matches/${dispute.matchId}`}
                      className="shrink-0 h-9 rounded-[10px] border border-border-faint bg-bg-elevated/60 px-3 text-[10px] font-bold tracking-wider text-muted-soft hover:text-accent hover:border-accent/20 transition-all duration-200 inline-flex items-center gap-1"
                    >
                      View Match
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                    </Link>
                  </div>

                  <div className="rounded-[12px] bg-bg-highlight/40 border border-border-faint p-3 mb-4">
                    <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mb-1">Reason</p>
                    <p className="text-sm text-ink">{dispute.reason}</p>
                    <p className="text-[10px] text-muted-soft mt-1.5">
                      Reported by @{dispute.reporter.displayName || dispute.reporter.username}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.matchId, "overturn")}
                      disabled={resolution[dispute.matchId] === "resolving"}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      ✓ Accept Result
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.matchId, "flag_user")}
                      disabled={resolution[dispute.matchId] === "resolving"}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      ⚑ Flag User
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.matchId, "cancel")}
                      disabled={resolution[dispute.matchId] === "resolving"}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-negative/10 text-negative border border-negative/20 hover:bg-negative/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      ✕ Cancel Match
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
