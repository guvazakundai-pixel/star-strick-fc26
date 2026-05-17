"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DisputeUser = {
  id: string;
  username: string;
  displayName: string | null;
};

type MatchInfo = {
  id: string;
  score1: number;
  score2: number;
  status: string;
  statusRaw: string;
  player1: DisputeUser;
  player2: DisputeUser;
};

type Dispute = {
  id: string;
  matchId: string;
  reason: string;
  description: string | null;
  status: string;
  resolution: string | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  match: MatchInfo | null;
  reporter: DisputeUser;
  resolver: DisputeUser | null;
};

type AuditEntry = {
  id: string;
  action: string;
  target: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  admin: DisputeUser;
};

export function DisputesClient({
  disputes,
  auditLogs,
  activeTab,
  statusColors,
  sessionRole,
}: {
  disputes: Dispute[];
  auditLogs: AuditEntry[];
  activeTab: string;
  statusColors: Record<string, string>;
  sessionRole: string;
}) {
  const router = useRouter();
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const handleResolve = useCallback(
    async (disputeId: string, matchId: string, action: "accept" | "flag" | "dismiss") => {
      setResolving((prev) => ({ ...prev, [disputeId]: true }));
      try {
        const res = await fetch("/api/admin/disputes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            disputeId,
            matchId,
            action,
            note: notes[disputeId] || null,
          }),
        });
        if (res.ok) router.refresh();
      } catch {
      } finally {
        setResolving((prev) => ({ ...prev, [disputeId]: false }));
      }
    },
    [notes, router],
  );

  if (disputes.length === 0) {
    return (
      <div className="frosted-card p-12 text-center">
        <span className="text-5xl block mb-4 opacity-20">&#9878;</span>
        <p className="text-muted-soft text-sm">No {activeTab.toLowerCase().replace(/_/g, " ")} disputes</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {disputes.map((dispute) => {
          const p1 = dispute.match?.player1;
          const p2 = dispute.match?.player2;
          const p1Name = p1?.displayName || p1?.username || "?";
          const p2Name = p2?.displayName || p2?.username || "?";
          const colorClass = statusColors[dispute.status] || statusColors.OPEN;

          return (
            <motion.div
              key={dispute.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="frosted-card rounded-[20px] p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em] border ${colorClass}`}
                    >
                      {dispute.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] font-mono text-muted-faint">
                      {new Date(dispute.createdAt).toLocaleDateString("en-ZW", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {dispute.match ? (
                    <Link
                      href={`/matches/${dispute.matchId}`}
                      className="group inline-block"
                    >
                      <p className="text-sm font-bold text-ink group-hover:text-accent transition-colors">
                        {p1Name} vs {p2Name}
                      </p>
                      <p className="text-[11px] text-muted-soft mt-0.5">
                        Score: {dispute.match.score1} &ndash; {dispute.match.score2}
                      </p>
                    </Link>
                  ) : (
                    <p className="text-sm text-muted-soft">Match deleted</p>
                  )}
                </div>

                <Link
                  href={`/matches/${dispute.matchId}`}
                  className="shrink-0 h-9 rounded-[10px] border border-border-faint bg-bg-elevated/60 px-3 text-[10px] font-bold tracking-wider text-muted-soft hover:text-accent hover:border-accent/20 transition-all duration-200 inline-flex items-center gap-1"
                >
                  Match
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="rounded-[12px] bg-bg-highlight/40 border border-border-faint p-3 mb-4">
                <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mb-1">
                  Reason
                </p>
                <p className="text-sm text-ink">{dispute.reason}</p>
                {dispute.description && (
                  <p className="text-xs text-muted-soft mt-1.5">{dispute.description}</p>
                )}
                <p className="text-[10px] text-muted-soft mt-1.5">
                  Reported by @{dispute.reporter.displayName || dispute.reporter.username}
                </p>
                {dispute.resolver && (
                  <p className="text-[10px] text-muted-soft mt-0.5">
                    Resolved by @{dispute.resolver.displayName || dispute.resolver.username}
                    {dispute.resolvedAt && (
                      <> &middot; {new Date(dispute.resolvedAt).toLocaleDateString("en-ZW")}</>
                    )}
                  </p>
                )}
              </div>

              {dispute.resolution && (
                <div className="rounded-[12px] bg-accent/5 border border-accent/10 p-3 mb-4">
                  <p className="text-[8px] font-black tracking-[0.2em] uppercase text-accent mb-1">
                    Resolution
                  </p>
                  <p className="text-sm text-ink">{dispute.resolution}</p>
                  {dispute.resolutionNote && (
                    <p className="text-xs text-muted-soft mt-1">{dispute.resolutionNote}</p>
                  )}
                </div>
              )}

              {dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <textarea
                      placeholder="Resolution notes (optional)..."
                      value={notes[dispute.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [dispute.id]: e.target.value }))
                      }
                      rows={2}
                      className="w-full rounded-[12px] border border-border-faint bg-bg-highlight/30 px-3 py-2 text-xs text-ink placeholder:text-muted-faint outline-none focus:border-accent/30 resize-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(dispute.id, dispute.matchId, "accept")}
                      disabled={resolving[dispute.id]}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      {resolving[dispute.id] ? (
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                      ) : (
                        "Accept Result"
                      )}
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, dispute.matchId, "flag")}
                      disabled={resolving[dispute.id]}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      Flag User
                    </button>
                    <button
                      onClick={() => handleResolve(dispute.id, dispute.matchId, "dismiss")}
                      disabled={resolving[dispute.id]}
                      className="flex-1 h-11 rounded-[12px] font-bold text-[10px] tracking-[0.16em] uppercase transition-all duration-200 bg-negative/10 text-negative border border-negative/20 hover:bg-negative/20 disabled:opacity-50 active:scale-[0.97]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}

              {sessionRole === "ADMIN" && (
                <button
                  onClick={() =>
                    setExpandedLog(expandedLog === dispute.id ? null : dispute.id)
                  }
                  className="mt-3 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-faint hover:text-ink transition-colors"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`w-3 h-3 transition-transform ${expandedLog === dispute.id ? "rotate-90" : ""}`}
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  Activity Log
                </button>
              )}

              {expandedLog === dispute.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-2 rounded-[12px] bg-bg-highlight/30 border border-border-faint overflow-hidden"
                >
                  <div className="max-h-40 overflow-y-auto divide-y divide-border-faint">
                    {auditLogs
                      .filter(
                        (log) =>
                          log.target === dispute.id || log.target === dispute.matchId,
                      )
                      .map((log) => (
                        <div key={log.id} className="px-3 py-2 text-[11px]">
                          <span className="font-bold text-ink">
                            @{log.admin.displayName || log.admin.username}
                          </span>{" "}
                          <span className="text-muted-soft">{log.action}</span>
                          <span className="text-muted-faint ml-2">
                            {new Date(log.createdAt).toLocaleString("en-ZW")}
                          </span>
                        </div>
                      ))}
                    {auditLogs.filter(
                      (log) =>
                        log.target === dispute.id || log.target === dispute.matchId,
                    ).length === 0 && (
                      <div className="px-3 py-2 text-[11px] text-muted-faint">
                        No activity logged for this dispute.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
