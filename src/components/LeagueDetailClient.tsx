"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Standing = {
  userId: string;
  username: string;
  displayName?: string | null;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
};

type Fixture = {
  id: string;
  matchday: number;
  homeUser: { id: string; username: string; displayName?: string | null };
  awayUser: { id: string; username: string; displayName?: string | null };
  homeScore: number | null;
  awayScore: number | null;
  status: string;
};

type Participant = {
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
};

type PlayoffMatch = {
  id: string;
  round: number;
  matchIndex: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
  bracket: string | null;
  player1: { id: string; username: string; displayName?: string | null } | null;
  player2: { id: string; username: string; displayName?: string | null } | null;
  winner: { id: string; username: string; displayName?: string | null } | null;
};

type LeagueDetail = {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  status: string;
  season?: string | null;
  maxPlayers: number;
  participantCount: number;
  inviteCode?: string | null;
  playoffQualifiers: number;
  playoffType: string | null;
  playoffGenerated: boolean;
  admin: { id: string; username: string; displayName?: string | null };
};

type LeagueStats = {
  topScorer?: { username: string; displayName?: string | null; goals: number } | null;
  mostCleanSheets?: { username: string; displayName?: string | null; cleanSheets: number } | null;
};

type LeagueDetailClientProps = {
  league: LeagueDetail;
  standings?: Standing[];
  fixtures?: Fixture[];
  participants?: Participant[];
  stats?: LeagueStats | null;
  isMember?: boolean;
  isAdmin?: boolean;
  currentUserId?: string;
  onJoin?: () => void;
  onLeave?: () => void;
  onEdit?: () => void;
  className?: string;
};

function FormIndicator({ form }: { form: string }) {
  return (
    <div className="flex gap-0.5">
      {form.split("").slice(-5).map((r, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${r === "W" ? "bg-accent" : r === "D" ? "bg-gold" : r === "L" ? "bg-negative" : "bg-muted-faint"}`} />
      ))}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export function LeagueDetailClient({
  league,
  standings = [],
  fixtures = [],
  participants = [],
  stats,
  isMember = false,
  isAdmin = false,
  currentUserId,
  onJoin,
  onLeave,
  onEdit,
  className = "",
}: LeagueDetailClientProps) {
  const [tab, setTab] = useState<string>("standings");
  const [filterMD, setFilterMD] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [playoffMatches, setPlayoffMatches] = useState<PlayoffMatch[]>([]);
  const [playoffLoading, setPlayoffLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [scoreModal, setScoreModal] = useState<{ match: PlayoffMatch } | null>(null);

  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return b.wins - a.wins;
  });

  const maxMD = fixtures.reduce((max, f) => Math.max(max, f.matchday), 0);
  const matchdays = filterMD !== null ? [filterMD] : Array.from({ length: maxMD }, (_, i) => i + 1);

  const statusColor = league.status === "LIVE" ? "text-accent" : league.status === "COMPLETED" ? "text-muted-soft" : "text-cyan";
  const adminName = league.admin.displayName || league.admin.username;

  const hasPlayoffs = league.playoffQualifiers > 0;
  const showPlayoffsTab = hasPlayoffs && (league.playoffGenerated || isAdmin);

  const myFixtures = fixtures.filter(
    (f) => f.status !== "COMPLETED" && currentUserId && (f.homeUser.id === currentUserId || f.awayUser.id === currentUserId),
  );

  const fetchPlayoffs = useCallback(async () => {
    setPlayoffLoading(true);
    try {
      const res = await fetch(`/api/leagues/${league.id}/playoffs`);
      const d = await res.json();
      setPlayoffMatches(d.data?.matches ?? []);
    } catch { /* ignore */ }
    setPlayoffLoading(false);
  }, [league.id]);

  useEffect(() => {
    if (league.playoffGenerated) fetchPlayoffs();
  }, [league.playoffGenerated, fetchPlayoffs]);

  const handleGeneratePlayoffs = async () => {
    setGenLoading(true);
    try {
      const res = await fetch(`/api/leagues/${league.id}/generate-playoffs`, { method: "POST" });
      const d = await res.json();
      if (d.success) {
        setPlayoffMatches(d.data?.matches ?? []);
        window.location.reload();
      }
    } catch { /* ignore */ }
    setGenLoading(false);
  };

  const handleAdvanceMatch = async (match: PlayoffMatch, score1: number, score2: number) => {
    setAdvancingId(match.id);
    try {
      const res = await fetch(`/api/leagues/${league.id}/playoffs/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score1, score2 }),
      });
      const d = await res.json();
      if (d.success) setPlayoffMatches(d.data?.matches ?? []);
    } catch { /* ignore */ }
    setAdvancingId(null);
    setScoreModal(null);
  };

  const handleCopyInvite = () => {
    if (league.inviteCode) {
      navigator.clipboard.writeText(league.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const allTabs = [
    { id: "standings", label: `Table (${sorted.length})` },
    { id: "fixtures", label: `Fixtures (${fixtures.length})` },
    ...(isMember && currentUserId ? [{ id: "my-matches" as string, label: "My Matches" }] : []),
    ...(showPlayoffsTab ? [{ id: "playoffs" as string, label: `Playoffs (${playoffMatches.length})` }] : []),
    { id: "info", label: "Info" },
  ];

  const maxPlayoffRound = playoffMatches.length > 0 ? Math.max(...playoffMatches.map((m) => m.round)) : 0;
  const playoffRounds: Record<number, PlayoffMatch[]> = {};
  for (const m of playoffMatches) {
    if (!playoffRounds[m.round]) playoffRounds[m.round] = [];
    playoffRounds[m.round].push(m);
  }

  const roundLabels: Record<number, string> = {};
  const wbRounds = playoffMatches.filter((m) => m.bracket === "WB").length > 0
    ? Math.max(...playoffMatches.filter((m) => m.bracket === "WB").map((m) => m.round))
    : maxPlayoffRound;
  for (let r = 1; r <= maxPlayoffRound; r++) {
    if (r >= 50) {
      roundLabels[r] = `LB R${r - 49}`;
    } else if (r === wbRounds) roundLabels[r] = "Final";
    else if (r === wbRounds - 1) roundLabels[r] = "Semifinals";
    else if (r === wbRounds - 2) roundLabels[r] = "Quarterfinals";
    else roundLabels[r] = `R${r}`;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Link href="/leagues" className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Leagues
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="frosted-card-sm rounded-[24px] p-6 sm:p-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(18,20,24,0.7), rgba(18,20,24,0.4))", border: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: league.status === "LIVE" ? "radial-gradient(600px 300px at 30% 20%, rgba(0,255,133,0.06), transparent 70%)" : "radial-gradient(600px 300px at 30% 20%, rgba(34,211,238,0.04), transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${statusColor}`}>{league.status}</span>
            <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">{league.type}</span>
            {league.season && <span className="text-[9px] font-bold tracking-wider text-muted-soft uppercase">{league.season}</span>}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="cinematic-heading text-3xl sm:text-5xl text-ink leading-[0.88]">{league.name}</h1>
              <p className="text-sm text-muted-soft mt-2 flex items-center gap-2"><ShieldIcon /> Admin: {adminName} &middot; {league.participantCount}/{league.maxPlayers} players</p>
            </div>
          </div>
          {league.description && <p className="text-sm text-ink-soft leading-relaxed mt-4 max-w-2xl">{league.description}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            {!isMember && onJoin && <button onClick={onJoin} className="h-11 px-6 rounded-[14px] cta-primary font-bold text-sm tracking-[0.18em] uppercase text-[#0D0D0F]">Join League</button>}
            {isMember && onLeave && <button onClick={onLeave} className="h-11 px-6 rounded-[14px] text-sm font-bold uppercase tracking-wider border border-negative/30 text-negative hover:bg-negative/10 transition-all">Leave League</button>}
            {isAdmin && league.inviteCode && (
              <button onClick={handleCopyInvite} className="h-11 px-4 rounded-[14px] text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all" style={{ background: "rgba(0,255,133,0.06)", border: "1px solid rgba(0,255,133,0.12)", color: "var(--accent)" }}>
                {copied ? <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M20 6L9 17l-5-5" /></svg> Copied!</> : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg> Invite Code</>}
              </button>
            )}
            {isAdmin && onEdit && <button onClick={onEdit} className="h-11 px-4 rounded-[14px] text-[10px] font-bold uppercase tracking-wider transition-all" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--muted-soft)" }}>Edit League</button>}
          </div>
        </div>
      </motion.div>

      {stats && (stats.topScorer || stats.mostCleanSheets) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.topScorer && (
            <div className="frosted-card-sm p-4 rounded-[16px] flex items-center gap-3">
              <div className="h-10 w-10 rounded-[12px] shrink-0 grid place-items-center" style={{ background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.1)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-faint">Top Scorer</p>
                <p className="text-sm font-bold text-ink truncate">{stats.topScorer.displayName || stats.topScorer.username}</p>
                <p className="text-[11px] text-accent font-bold tabular-nums">{stats.topScorer.goals} goals</p>
              </div>
            </div>
          )}
          {stats.mostCleanSheets && (
            <div className="frosted-card-sm p-4 rounded-[16px] flex items-center gap-3">
              <div className="h-10 w-10 rounded-[12px] shrink-0 grid place-items-center" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.1)" }}>
                <ShieldIcon />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-wider text-muted-faint">Most Clean Sheets</p>
                <p className="text-sm font-bold text-ink truncate">{stats.mostCleanSheets.displayName || stats.mostCleanSheets.username}</p>
                <p className="text-[11px] text-cyan font-bold tabular-nums">{stats.mostCleanSheets.cleanSheets}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="flex gap-1 p-1 rounded-[14px] overflow-x-auto bc-no-scrollbar" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
        {allTabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`shrink-0 px-4 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${tab === t.id ? "bg-accent/15 text-accent" : "text-muted-soft hover:text-ink"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "standings" && (
          <motion.div key="standings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <div className="rounded-[20px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center px-4 py-3 text-[9px] font-black uppercase tracking-[0.2em] text-muted-faint border-b border-border-faint">
                <span className="w-8">#</span><span className="flex-1">Player</span><span className="w-7 text-center">P</span><span className="w-7 text-center">W</span><span className="w-7 text-center">D</span><span className="w-7 text-center">L</span>
                <span className="w-8 text-center">GF</span><span className="w-8 text-center">GA</span><span className="w-9 text-center">GD</span><span className="w-9 text-center">Pts</span><span className="w-14 text-center hidden sm:block">Form</span>
              </div>
              {sorted.map((s, i) => {
                const isQual = hasPlayoffs && i < league.playoffQualifiers;
                const isReleg = i >= sorted.length - 2;
                return (
                  <div key={s.userId} className="flex items-center px-4 py-3 text-sm border-b border-border-faint last:border-0 hover:bg-white/[0.02] transition-colors" style={isQual ? { borderLeft: "2px solid var(--accent)" } : isReleg ? { borderLeft: "2px solid rgba(255,77,77,0.4)" } : {}}>
                    <span className={`w-8 font-mono text-xs ${i === 0 ? "text-gold font-bold" : i < 3 ? "text-accent" : "text-muted-soft"}`}>{i + 1}</span>
                    <Link href={`/player/${s.username}`} className="flex-1 font-medium text-ink truncate hover:text-accent transition-colors">{s.displayName || s.username}</Link>
                    <span className="w-7 text-center font-mono text-xs text-muted-soft">{s.played}</span>
                    <span className="w-7 text-center font-mono text-xs text-muted-soft">{s.wins}</span>
                    <span className="w-7 text-center font-mono text-xs text-muted-soft">{s.draws}</span>
                    <span className="w-7 text-center font-mono text-xs text-muted-soft">{s.losses}</span>
                    <span className="w-8 text-center font-mono text-xs text-muted-soft">{s.goalsFor}</span>
                    <span className="w-8 text-center font-mono text-xs text-muted-soft">{s.goalsAgainst}</span>
                    <span className={`w-9 text-center font-mono text-xs font-bold ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"}`}>{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</span>
                    <span className="w-9 text-center font-mono text-sm font-bold text-ink">{s.points}</span>
                    <div className="w-14 hidden sm:flex justify-center"><FormIndicator form={s.form} /></div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-faint">
              <span className="flex items-center gap-1"><span className="h-2 w-0.5 rounded-full bg-accent" /> Qualification</span>
              <span className="flex items-center gap-1"><span className="h-2 w-0.5 rounded-full bg-negative/40" /> Relegation</span>
            </div>
          </motion.div>
        )}

        {tab === "fixtures" && (
          <motion.div key="fixtures" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {maxMD > 1 && (
              <div className="flex gap-1 mb-4 overflow-x-auto bc-no-scrollbar">
                <button onClick={() => setFilterMD(null)} className={`shrink-0 px-3 py-1.5 rounded-[10px] text-[9px] font-bold uppercase tracking-wider transition-all ${filterMD === null ? "bg-accent/15 text-accent" : "text-muted-faint hover:text-muted-soft"}`}>All</button>
                {Array.from({ length: maxMD }, (_, i) => i + 1).map((md) => (
                  <button key={md} onClick={() => setFilterMD(md)} className={`shrink-0 px-3 py-1.5 rounded-[10px] text-[9px] font-bold uppercase tracking-wider transition-all ${filterMD === md ? "bg-accent/15 text-accent" : "text-muted-faint hover:text-muted-soft"}`}>MD {md}</button>
                ))}
              </div>
            )}
            <div className="space-y-2">
              {matchdays.map((md) => {
                const dayFixtures = fixtures.filter((f) => f.matchday === md);
                if (dayFixtures.length === 0) return null;
                return (
                  <div key={md}>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft mb-2">Matchday {md}</p>
                    <div className="space-y-1">
                      {dayFixtures.map((f) => {
                        const isComplete = f.status === "COMPLETED";
                        return (
                          <div key={f.id} className="flex items-center justify-between px-4 py-3 rounded-[16px] transition-colors hover:bg-white/[0.02]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                            <span className={`text-sm font-medium truncate max-w-[35%] ${isComplete && f.homeScore !== null && f.awayScore !== null && f.homeScore > f.awayScore ? "text-accent" : "text-ink"}`}>{f.homeUser.displayName || f.homeUser.username}</span>
                            <div className="flex items-center gap-2">
                              {isComplete && f.homeScore !== null && f.awayScore !== null ? <span className="font-mono text-lg font-bold tabular-nums text-ink">{f.homeScore} – {f.awayScore}</span> : <span className="text-xs text-muted-faint uppercase tracking-wider">vs</span>}
                            </div>
                            <span className={`text-sm font-medium truncate max-w-[35%] text-right ${isComplete && f.homeScore !== null && f.awayScore !== null && f.awayScore > f.homeScore ? "text-accent" : "text-ink"}`}>{f.awayUser.displayName || f.awayUser.username}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {fixtures.length === 0 && <div className="frosted-card-sm p-10 text-center rounded-[20px]"><p className="text-sm text-muted-soft">No fixtures yet</p></div>}
            </div>
          </motion.div>
        )}

        {tab === "my-matches" && (
          <motion.div key="my-matches" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {myFixtures.length === 0 ? (
              <div className="frosted-card-sm p-10 text-center rounded-[20px]"><p className="text-sm text-muted-soft">No upcoming matches for you</p></div>
            ) : (
              <div className="space-y-2">
                {myFixtures.map((f) => (
                  <div key={f.id} className="frosted-card-sm p-4 rounded-[16px] flex items-center justify-between" style={{ borderLeft: "2px solid var(--accent)" }}>
                    <div className="min-w-0 flex-1 text-right"><p className="text-sm font-bold text-ink truncate">{f.homeUser.displayName || f.homeUser.username}</p></div>
                    <div className="shrink-0 px-4 text-center"><span className="text-[9px] text-muted-faint uppercase tracking-wider">vs</span></div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold text-ink truncate">{f.awayUser.displayName || f.awayUser.username}</p></div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "playoffs" && (
          <motion.div key="playoffs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            {!league.playoffGenerated && isAdmin && (
              <div className="frosted-card-sm p-8 rounded-[24px] text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <TrophyIcon />
                  <h3 className="cinematic-heading text-xl text-ink">Playoffs</h3>
                </div>
                <p className="text-sm text-muted-soft mb-4 max-w-md mx-auto">
                  Generate a {league.playoffType === "DOUBLE_ELIM" ? "double elimination" : "single elimination"} bracket for the top {league.playoffQualifiers} players.
                </p>
                <button
                  onClick={handleGeneratePlayoffs}
                  disabled={genLoading}
                  className="btn-primary h-12 px-8 rounded-[14px] font-bold text-sm tracking-[0.18em] uppercase disabled:opacity-50"
                >
                  {genLoading ? "Generating..." : `Generate ${league.playoffType === "DOUBLE_ELIM" ? "Double Elim" : "Knockout"} Bracket`}
                </button>
              </div>
            )}

            {league.playoffGenerated && playoffLoading && (
              <div className="frosted-card-sm p-10 text-center rounded-[24px]">
                <div className="animate-pulse space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-[12px] bg-white/5" />)}
                </div>
              </div>
            )}

            {league.playoffGenerated && !playoffLoading && playoffMatches.length > 0 && (
              <div className="space-y-4">
                {Object.entries(playoffRounds).map(([roundStr, matches]) => {
                  const r = parseInt(roundStr);
                  const isLB = r >= 50;
                  return (
                    <div key={r}>
                      <div className="flex items-center gap-2 mb-3">
                        {isLB && <span className="text-[9px] font-black uppercase tracking-wider text-negative/60 px-2 py-0.5 rounded-full border border-negative/20 bg-negative/5 text-negative">Losers</span>}
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">{roundLabels[r] || `Round ${r}`}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {matches.map((m) => {
                          const isComplete = m.status === "COMPLETED";
                          const isLive = m.status === "LIVE";
                          return (
                            <div
                              key={m.id}
                              className={`frosted-card-sm p-4 rounded-[16px] transition-all ${isLive ? "border-accent/20" : ""} ${isComplete ? "opacity-70" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-xs font-medium truncate ${m.winnerId === m.player1?.id ? "text-accent" : "text-ink"}`}>
                                  {m.player1?.displayName || m.player1?.username || "TBD"}
                                </span>
                                {isComplete && m.score1 !== null && <span className="font-mono text-xs text-muted-soft tabular-nums">{m.score1}</span>}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium truncate ${m.winnerId === m.player2?.id ? "text-accent" : "text-ink-soft"}`}>
                                  {m.player2?.displayName || m.player2?.username || "TBD"}
                                </span>
                                {isComplete && m.score2 !== null && <span className="font-mono text-xs text-muted-soft tabular-nums">{m.score2}</span>}
                              </div>
                              {!isComplete && isAdmin && m.player1Id && m.player2Id && (
                                <button
                                  onClick={() => setScoreModal({ match: m })}
                                  disabled={advancingId === m.id}
                                  className="mt-2 w-full py-1.5 rounded-[8px] text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/20 transition-all disabled:opacity-50"
                                >
                                  {advancingId === m.id ? "Saving..." : "Enter Score"}
                                </button>
                              )}
                              {m.status === "PENDING" && (!m.player1Id || !m.player2Id) && (
                                <p className="mt-1.5 text-center text-[9px] text-muted-faint uppercase tracking-wider">Awaiting opponent</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {isAdmin && (
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={fetchPlayoffs}
                      className="h-9 px-4 rounded-[10px] text-[9px] font-bold uppercase tracking-wider bg-white/5 text-muted-soft hover:text-ink transition-all border border-border-faint"
                    >
                      Refresh Playoffs
                    </button>
                  </div>
                )}
              </div>
            )}

            {league.playoffGenerated && !playoffLoading && playoffMatches.length === 0 && (
              <div className="frosted-card-sm p-10 text-center rounded-[24px]">
                <TrophyIcon />
                <p className="text-sm text-muted-soft mt-3">No playoff matches found</p>
              </div>
            )}
          </motion.div>
        )}

        {tab === "info" && (
          <motion.div key="info" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
            <div className="glass rounded-[24px] p-6 space-y-4">
              {[
                { label: "Type", value: league.type },
                { label: "Status", value: league.status },
                { label: "Season", value: league.season || "—" },
                { label: "Players", value: `${league.participantCount} / ${league.maxPlayers}` },
                { label: "Admin", value: adminName },
                { label: "Total Fixtures", value: fixtures.length },
                ...(hasPlayoffs ? [
                  { label: "Playoff Format", value: league.playoffType === "DOUBLE_ELIM" ? "Double Elimination" : league.playoffType === "SINGLE_ELIM" ? "Single Elimination" : "—" },
                  { label: "Playoff Qualifiers", value: `${league.playoffQualifiers} teams` },
                  { label: "Playoffs", value: league.playoffGenerated ? "Generated" : "Not yet generated" },
                ] : []),
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">{item.label}</p>
                  <p className="text-sm text-ink font-bold">{item.value}</p>
                </div>
              ))}
              {isAdmin && league.inviteCode && (
                <div className="pt-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-2">Invite Code</p>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-[12px] cursor-pointer transition-colors hover:bg-accent/10" style={{ background: "rgba(0,255,133,0.05)", border: "1px solid rgba(0,255,133,0.1)" }} onClick={handleCopyInvite}>
                    <code className="flex-1 font-mono text-sm font-bold text-accent tracking-widest">{league.inviteCode}</code>
                    <span className="text-[9px] text-muted-soft uppercase tracking-wider">{copied ? "Copied!" : "Copy"}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setScoreModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="frosted-card-sm rounded-[24px] p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="cinematic-heading text-lg text-ink mb-4 text-center">Enter Score</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const s1 = parseInt(fd.get("score1") as string) || 0;
                  const s2 = parseInt(fd.get("score2") as string) || 0;
                  handleAdvanceMatch(scoreModal.match, s1, s2);
                }}
              >
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-bold text-ink mb-1 text-center">{scoreModal.match.player1?.displayName || scoreModal.match.player1?.username || "P1"}</p>
                    <input
                      name="score1"
                      type="number"
                      min="0"
                      max="99"
                      required
                      className="w-full h-12 rounded-[14px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40 transition-colors"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div className="text-center text-[10px] text-muted-faint uppercase tracking-wider font-bold">vs</div>
                  <div>
                    <p className="text-sm font-bold text-ink mb-1 text-center">{scoreModal.match.player2?.displayName || scoreModal.match.player2?.username || "P2"}</p>
                    <input
                      name="score2"
                      type="number"
                      min="0"
                      max="99"
                      required
                      className="w-full h-12 rounded-[14px] bg-white/5 border border-white/10 text-center text-2xl font-bold font-mono text-ink focus:outline-none focus:border-accent/40 transition-colors"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setScoreModal(null)} className="flex-1 h-11 rounded-[14px] text-[10px] font-bold uppercase tracking-wider border border-white/10 text-muted-soft hover:text-ink transition-all">Cancel</button>
                  <button type="submit" className="flex-1 h-11 rounded-[14px] cta-primary text-[10px] font-bold uppercase tracking-wider text-[#0D0D0F]">Submit</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
