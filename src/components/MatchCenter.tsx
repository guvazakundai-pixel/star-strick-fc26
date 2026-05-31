"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "@/lib/session-client";
import { useAuthModal } from "@/lib/auth-context";
import { ChallengeModal } from "@/components/SimpleChallengeModal";
import { JoinChallengeForm } from "@/components/JoinChallengeForm";
import { useRealtime } from "@/lib/realtime-updates";

type MatchPlayer = {
  id: string;
  username: string;
  displayName?: string | null;
};

type MatchItem = {
  id: string;
  player1: MatchPlayer;
  player2: MatchPlayer;
  score1: number | null;
  score2: number | null;
  status: string;
  statusRaw: string;
  isDisputed: boolean;
  winnerId: string | null;
  createdAt: string;
};

type MatchStats = {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
};

type MatchCenterProps = {
  matches?: MatchItem[];
  stats?: MatchStats;
  onChallenge?: () => void;
  onViewMatch?: (id: string) => void;
  className?: string;
};

function SwordsIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2 2" />
      <path d="M21 3l-6 6" /><path d="M6.5 9.5L3 6" />
    </svg>
  );
}

function TrophyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M12 15v3" /><path d="M8 21h8" />
      <path d="M8 4v1" /><path d="M16 4v1" />
    </svg>
  );
}

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function LightningIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING_ACCEPTANCE: { label: "Pending", color: "text-gold" },
  ACTIVE: { label: "Live", color: "text-accent" },
  SCORE_SUBMITTED: { label: "Submitted", color: "text-cyan" },
  PENDING_VERIFICATION: { label: "Verifying", color: "text-cyan" },
  COMPLETED: { label: "Completed", color: "text-emerald" },
  CONFIRMED: { label: "Confirmed", color: "text-emerald" },
  APPROVED: { label: "Approved", color: "text-accent" },
  DISPUTED: { label: "Disputed", color: "text-negative" },
  CANCELLED: { label: "Cancelled", color: "text-muted-soft" },
};

function statusLabel(raw: string) {
  return STATUS_META[raw] ?? { label: raw, color: "text-muted-soft" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function MatchCenter({
  matches: propMatches,
  stats: propStats,
  onChallenge: propOnChallenge,
  onViewMatch: propOnViewMatch,
  className = "",
}: MatchCenterProps) {
  const session = useSession();
  const { openAuth } = useAuthModal();

  const [filter, setFilter] = useState<string>("all");
  const [challengeSearch, setChallengeSearch] = useState("");
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [showChallenge, setShowChallenge] = useState(false);

  const [fetchedMatches, setFetchedMatches] = useState<MatchItem[]>([]);
  const [fetchedStats, setFetchedStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(false);

  const isSelfFetching = propMatches === undefined;

  const fetchData = useCallback(async () => {
    if (!isSelfFetching || !session?.userId) return;
    setLoading(true);
    try {
      const [matchesRes, hubRes] = await Promise.all([
        fetch(`/api/matches?limit=50&player=${session.userId}`),
        fetch(`/api/player/hub`).catch(() => null),
      ]);
      const matchesData = await matchesRes.json();
      setFetchedMatches(matchesData.matches ?? []);
      if (hubRes?.ok) {
        const hubData = await hubRes.json();
        const ps = hubData.stats ?? hubData.playerStats ?? {};
        setFetchedStats({
          totalMatches: ps.matchesPlayed ?? ps.totalMatches ?? 0,
          wins: ps.wins ?? 0,
          losses: ps.losses ?? 0,
          draws: ps.draws ?? 0,
          winRate: ps.matchesPlayed > 0 ? Math.round((ps.wins / ps.matchesPlayed) * 100) : 0,
          currentStreak: ps.winStreak ?? ps.currentStreak ?? 0,
          bestStreak: ps.bestStreak ?? 0,
        });
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isSelfFetching, session?.userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useRealtime("match-updated", useCallback(() => { fetchData(); }, [fetchData]));

  const matches = propMatches ?? fetchedMatches;
  const stats = propStats ?? fetchedStats;
  const onChallenge = propOnChallenge ?? (() => {
    if (!session) { openAuth("signin"); return; }
    setChallengeTarget(null);
    setShowChallenge(true);
  });
  const onViewMatch = propOnViewMatch ?? ((id: string) => {
    window.location.href = `/matches/${id}`;
  });

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "live")
      return matches.filter((m) =>
        ["ACTIVE", "SCORE_SUBMITTED", "PENDING_VERIFICATION"].includes(m.statusRaw)
      );
    if (filter === "pending")
      return matches.filter((m) =>
        ["PENDING_ACCEPTANCE", "PENDING_VERIFICATION"].includes(m.statusRaw)
      );
    if (filter === "completed")
      return matches.filter((m) =>
        ["COMPLETED", "CONFIRMED", "APPROVED"].includes(m.statusRaw)
      );
    return matches;
  }, [matches, filter]);

  const activeMatches = matches.filter((m) =>
    ["ACTIVE", "SCORE_SUBMITTED", "PENDING_VERIFICATION", "PENDING_ACCEPTANCE"].includes(m.statusRaw)
  );

  const recentCompleted = matches
    .filter((m) => ["COMPLETED", "CONFIRMED", "APPROVED"].includes(m.statusRaw))
    .slice(0, 5);

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "live", label: "Live" },
    { id: "pending", label: "Pending" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Stats Summary */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Total Matches", value: stats.totalMatches, color: "text-ink" },
            { label: "Win Rate", value: `${stats.winRate}%`, color: "text-accent" },
            { label: "Wins", value: stats.wins, color: "text-accent" },
            { label: "Streak", value: `${stats.currentStreak}`, color: stats.currentStreak >= 3 ? "text-gold" : "text-muted-soft" },
          ].map((s) => (
            <div key={s.label} className="frosted-card-sm p-4 sm:p-5 rounded-[18px] text-center">
              <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Play Now CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <button
          onClick={onChallenge}
          className="group relative overflow-hidden w-full text-left rounded-[24px] transition-all duration-400 hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,133,0.12), rgba(0,230,118,0.04))",
            border: "1px solid rgba(0,255,133,0.15)",
            boxShadow: "0 0 60px -12px rgba(0,255,133,0.15), 0 12px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(500px 200px at 50% 40%, rgba(0,255,133,0.08), transparent 70%)",
            }}
          />
          <div className="relative z-10 p-6 sm:p-8 flex items-center gap-5 sm:gap-8">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-[20px] shrink-0 grid place-items-center"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,133,0.15), rgba(34,211,238,0.06))",
                border: "1px solid rgba(0,255,133,0.12)",
              }}
            >
              <SwordsIcon className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-accent mb-1">Quick Match</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink leading-[0.9]">Play Now</h2>
              <p className="mt-1 text-[13px] text-muted-soft">Challenge a player, submit scores, climb the ranks.</p>
            </div>
            <div className="shrink-0 ml-auto hidden sm:flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-accent">
              Challenge
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
                <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </motion.div>

      {/* Join by Code */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.075 }}
      >
        <JoinChallengeForm />
      </motion.div>

      {/* Challenge a Player */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-soft">Challenge a Player</h3>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-faint" />
          <input
            type="text"
            value={challengeSearch}
            onChange={(e) => setChallengeSearch(e.target.value)}
            placeholder="Search by gamertag or name..."
            className="input-premium w-full pl-11 pr-4 py-3 rounded-[16px] text-sm text-ink outline-none"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          {challengeSearch.length >= 2 && (
            <PlayerSearchDropdown
              query={challengeSearch}
              onSelect={(player) => {
                if (!session) { openAuth("signin"); return; }
                setChallengeTarget({ id: player.id, name: player.displayName || player.username });
                setShowChallenge(true);
                setChallengeSearch("");
              }}
              onClose={() => setChallengeSearch("")}
            />
          )}
        </div>
      </motion.div>

      {/* Active Matches */}
      {activeMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent live-ring" />
            <h3 className="text-[10px] font-black tracking-[0.28em] uppercase text-accent">
              Active Matches ({activeMatches.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeMatches.map((match, i) => (
              <MatchCard
                key={match.id}
                match={match}
                index={i}
                onView={onViewMatch}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Tabs + Match List */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <h3 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-soft">Match History</h3>

        <div className="flex gap-1.5 overflow-x-auto bc-no-scrollbar pb-1">
          {filterTabs.map((t) => (
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
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="frosted-card-sm p-10 text-center">
            <LightningIcon className="h-8 w-8 mx-auto mb-3 text-muted-faint" />
            <p className="text-sm text-muted-soft">No matches found</p>
            {onChallenge && (
              <button
                onClick={onChallenge}
                className="inline-flex mt-4 h-10 rounded-[14px] cta-primary px-5 text-sm font-bold tracking-wider items-center justify-center"
              >
                Start a Match
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {filtered.map((match, i) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  index={i}
                  onView={onViewMatch}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      {/* Loading State */}
      {isSelfFetching && loading && matches.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="frosted-card-sm p-5 rounded-[18px] animate-pulse">
              <div className="h-5 w-3/4 rounded bg-bg-highlight/50" />
            </div>
          ))}
        </motion.div>
      )}

      {/* Not signed in */}
      {isSelfFetching && !session && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="frosted-card-sm p-10 text-center rounded-[18px]"
        >
          <LightningIcon className="h-8 w-8 mx-auto mb-3 text-muted-faint" />
          <p className="text-sm text-muted-soft mb-4">Sign in to play matches and track your record</p>
          <button onClick={() => openAuth("signin")}
            className="h-12 rounded-[14px] cta-primary px-6 text-sm font-bold tracking-wider"
          >
            Sign In
          </button>
        </motion.div>
      )}

      {/* Challenge Modal */}
      <ChallengeModal
        open={showChallenge}
        onClose={() => { setShowChallenge(false); setChallengeTarget(null); }}
        opponentId={challengeTarget?.id}
        opponentName={challengeTarget?.name}
      />

      {/* Recent History (condensed) */}
      {recentCompleted.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <h3 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-soft">
            Recent Results
          </h3>
          <div className="space-y-1.5">
            {recentCompleted.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => onViewMatch?.(match.id)}
                  className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-[14px] transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${match.winnerId === match.player1.id ? "text-accent" : "text-muted-soft"}`}>
                      {match.player1.displayName || match.player1.username}
                    </span>
                    <span className="text-[9px] text-muted-faint">vs</span>
                    <span className={`text-sm font-semibold truncate ${match.winnerId === match.player2.id ? "text-accent" : "text-muted-soft"}`}>
                      {match.player2.displayName || match.player2.username}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-mono text-sm font-bold tabular-nums text-ink">
                      {match.score1}–{match.score2}
                    </span>
                    {match.isDisputed && (
                      <span className="text-[8px] font-bold text-negative">⚠</span>
                    )}
                    <span className="text-[9px] text-muted-faint">{timeAgo(match.createdAt)}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PlayerSearchDropdown({
  query,
  onSelect,
  onClose,
}: {
  query: string;
  onSelect: (player: { id: string; username: string; displayName: string | null }) => void;
  onClose: () => void;
}) {
  const [results, setResults] = useState<{ id: string; username: string; displayName: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults((data.users ?? []).slice(0, 8));
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  if (results.length === 0 && !loading) return null;

  return (
    <div
      ref={ref}
      className="absolute z-50 left-0 right-0 top-full mt-1 rounded-[16px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
    >
      {loading ? (
        <div className="p-4 text-center">
          <span className="h-4 w-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin inline-block" />
        </div>
      ) : (
        results.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors border-b border-border-faint last:border-0"
          >
            <div className="h-8 w-8 rounded-[10px] bg-accent/10 border border-accent/15 grid place-items-center shrink-0">
              <span className="text-[11px] font-bold text-accent">{(p.displayName || p.username)[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink truncate">{p.displayName || p.username}</p>
              <p className="font-mono text-[10px] text-muted-soft">@{p.username}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

function MatchCard({
  match,
  index,
  onView,
}: {
  match: MatchItem;
  index: number;
  onView?: (id: string) => void;
}) {
  const meta = statusLabel(match.statusRaw);
  const isLive = ["ACTIVE", "SCORE_SUBMITTED", "PENDING_VERIFICATION"].includes(match.statusRaw);
  const isDraw =
    !match.winnerId &&
    ["COMPLETED", "CONFIRMED", "APPROVED"].includes(match.statusRaw);
  const p1Name = match.player1.displayName || match.player1.username;
  const p2Name = match.player2.displayName || match.player2.username;
  const isP1Win = match.winnerId === match.player1.id;
  const isP2Win = match.winnerId === match.player2.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <button
        onClick={() => onView?.(match.id)}
        className="w-full text-left frosted-card-sm p-4 sm:p-5 rounded-[18px] transition-all duration-200 group relative overflow-hidden hover:border-accent/15"
        style={{
          border: isLive
            ? "1px solid rgba(0,255,133,0.15)"
            : match.isDisputed
            ? "1px solid rgba(255,77,77,0.12)"
            : undefined,
        }}
      >
        {isLive && (
          <span className="absolute top-3 right-3 match-badge match-badge-live">
            LIVE
          </span>
        )}

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 text-right">
            <p
              className={`text-sm font-bold truncate ${
                isP1Win ? "text-accent" : "text-ink"
              } group-hover:text-accent transition-colors`}
            >
              {p1Name}
            </p>
            <p className="font-mono text-[10px] text-muted-soft">
              @{match.player1.username}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[72px]">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xl font-bold tabular-nums ${
                  isP1Win ? "text-accent" : "text-ink"
                }`}
              >
                {match.score1 ?? "—"}
              </span>
              <span className="text-muted-faint text-[11px] font-mono">:</span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  isP2Win ? "text-accent" : "text-ink"
                }`}
              >
                {match.score2 ?? "—"}
              </span>
            </div>
            <span
              className={`text-[8px] font-black tracking-[0.18em] uppercase ${meta.color}`}
            >
              {meta.label}
            </span>
            {isDraw && (
              <span className="text-[8px] font-bold text-gold">Draw</span>
            )}
            {match.isDisputed && (
              <span className="text-[8px] font-bold text-negative">
                ⚠ Disputed
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-bold truncate ${
                isP2Win ? "text-accent" : "text-ink"
              } group-hover:text-accent transition-colors`}
            >
              {p2Name}
            </p>
            <p className="font-mono text-[10px] text-muted-soft">
              @{match.player2.username}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-mono text-[9px] text-muted-faint">
            {timeAgo(match.createdAt)}
          </span>
          <span className="font-mono text-[9px] text-muted-faint">
            {new Date(match.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
