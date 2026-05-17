"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Competition = {
  id: string;
  name: string;
  type: string;
  status: string;
  participantCount: number;
  maxPlayers: number;
  createdAt: string;
};

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-bg-highlight/50 text-muted-soft border border-border-faint",
  REGISTRATION: "bg-gold/10 text-gold border border-gold/20",
  LIVE: "bg-accent/10 text-accent border border-accent/20",
  COMPLETED: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  PAUSED: "bg-negative/10 text-negative border border-negative/20",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  REGISTRATION: "Registration",
  LIVE: "Live",
  COMPLETED: "Completed",
  PAUSED: "Paused",
};

export function AdminCompetitionManager({
  tournaments = [],
  leagues = [],
  onEdit,
  onStatusChange,
  onCreate,
  className = "",
}: {
  tournaments?: Competition[];
  leagues?: Competition[];
  onEdit?: (type: "tournament" | "league", id: string) => void;
  onStatusChange?: (type: "tournament" | "league", id: string, status: string) => void;
  onCreate?: (type: "tournament" | "league") => void;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState<"tournaments" | "leagues">("tournaments");
  const [search, setSearch] = useState("");

  const current = activeTab === "tournaments" ? tournaments : leagues;

  const stats = useMemo(() => {
    const total = current.length;
    const live = current.filter((c) => c.status === "LIVE").length;
    const completed = current.filter((c) => c.status === "COMPLETED").length;
    const draft = current.filter((c) => c.status === "DRAFT").length;
    return { total, live, completed, draft };
  }, [current]);

  const filtered = useMemo(() => {
    if (!search) return current;
    const q = search.toLowerCase();
    return current.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q),
    );
  }, [current, search]);

  return (
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint">
          {(["tournaments", "leagues"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
                activeTab === t
                  ? "bg-accent/15 text-accent shadow-sm"
                  : "text-muted-soft hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 rounded-[10px] border border-border-faint bg-bg-highlight/40 px-3 pl-8 text-[11px] text-ink placeholder:text-muted-faint outline-none focus:border-accent/30 transition-colors"
            />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-faint"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>

          <button
            onClick={() => onCreate?.(activeTab === "tournaments" ? "tournament" : "league")}
            className="h-8 px-3 rounded-[10px] bg-accent text-black text-[10px] font-black tracking-[0.14em] uppercase hover:brightness-110 transition-all active:scale-[0.97]"
          >
            Create
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total, color: "text-ink" },
          { label: "Live", value: stats.live, color: "text-accent" },
          { label: "Completed", value: stats.completed, color: "text-blue-400" },
          { label: "Draft", value: stats.draft, color: "text-muted-soft" },
        ].map((s) => (
          <div key={s.label} className="frosted-card-sm p-3 text-center">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-mono text-muted-faint uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {filtered.length === 0 ? (
            <p className="text-sm text-muted text-center py-10">
              {search ? "No matches found" : `No ${activeTab} yet`}
            </p>
          ) : (
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-v2-sm rounded-[18px] p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-ink truncate">{item.name}</span>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          STATUS_BADGES[item.status] || STATUS_BADGES.DRAFT
                        }`}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-faint font-mono">
                      {item.type} &middot; {item.participantCount}/{item.maxPlayers} players &middot;{" "}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onEdit?.(activeTab === "tournaments" ? "tournament" : "league", item.id)}
                      className="h-8 w-8 rounded-[10px] flex items-center justify-center border border-border-faint bg-bg-highlight/30 text-muted-soft hover:text-ink hover:border-accent/20 transition-all"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" />
                      </svg>
                    </button>

                    {item.status === "LIVE" && (
                      <button
                        onClick={() => onStatusChange?.(activeTab === "tournaments" ? "tournament" : "league", item.id, "PAUSED")}
                        className="h-8 w-8 rounded-[10px] flex items-center justify-center border border-gold/20 bg-gold/10 text-gold hover:bg-gold/20 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <rect x="6" y="4" width="4" height="16" />
                          <rect x="14" y="4" width="4" height="16" />
                        </svg>
                      </button>
                    )}

                    {item.status !== "LIVE" && item.status !== "COMPLETED" && (
                      <button
                        onClick={() => onStatusChange?.(activeTab === "tournaments" ? "tournament" : "league", item.id, "LIVE")}
                        className="h-8 w-8 rounded-[10px] flex items-center justify-center border border-accent/20 bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    )}

                    {item.status !== "COMPLETED" && (
                      <button
                        onClick={() => onStatusChange?.(activeTab === "tournaments" ? "tournament" : "league", item.id, "COMPLETED")}
                        className="h-8 w-8 rounded-[10px] flex items-center justify-center border border-negative/20 bg-negative/10 text-negative hover:bg-negative/20 transition-all"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
