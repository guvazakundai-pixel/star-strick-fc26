"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AnimatedBracket } from "@/components/ui/AnimatedBracket";
import { MatchdayHub } from "@/components/tournaments/MatchdayHub";

type Participant = {
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  seed: number;
  status: string;
  finalPosition?: number | null;
  assignedTeam?: string | null;
};

type TournamentMatch = {
  id: string;
  round: number;
  matchIndex: number;
  player1: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null } | null;
  player2: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null } | null;
  winner: { id: string; username: string; displayName?: string | null } | null;
  score1: number | null;
  score2: number | null;
  status: string;
  groupId?: string | null;
  bracket?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
};

type GroupData = {
  id: string;
  name: string;
  seed: number;
  standings: {
    id: string;
    userId: string;
    username?: string;
    displayName?: string | null;
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
  }[];
};

type TournamentDetail = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  city?: string | null;
  prizePool: number;
  entryFee: number;
  maxPlayers: number;
  description?: string | null;
  platform?: string | null;
  visibility: string;
  settings?: Record<string, unknown> | null;
  bracket?: unknown;
  startAt?: string | null;
  endAt?: string | null;
  createdAt: string;
  organizer: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
};

type TournamentDetailClientProps = {
  tournament: TournamentDetail;
  participants: Participant[];
  matches: TournamentMatch[];
  groups: GroupData[];
  typeLabel: string;
  statusLabel: string;
};

const typeLabels: Record<string, string> = {
  KNOCKOUT: "Knockout",
  ROUND_ROBIN: "Round Robin",
  GROUPS: "Group + Knockout",
};

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
      <path d="M6 9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M12 15v3" /><path d="M8 21h8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function TournamentDetailClient({
  tournament,
  participants,
  matches,
  groups,
  typeLabel,
  statusLabel,
}: TournamentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<string>("matchday");
  const [registering, setRegistering] = useState(false);

  const canRegister = tournament.status === "REGISTRATION";
  const isOrganizer = false;

  const statusColor =
    tournament.status === "LIVE"
      ? "text-accent"
      : tournament.status === "REGISTRATION"
      ? "text-gold"
      : tournament.status === "COMPLETED"
      ? "text-muted-soft"
      : "text-muted-faint";

  const organizerName = tournament.organizer.displayName || tournament.organizer.username;

  const bracketRounds = (() => {
    if (!tournament.bracket) return [];
    const raw = Array.isArray(tournament.bracket) ? tournament.bracket : [];
    if (raw.length === 0) return [];
    const maxRound = Math.max(...raw.map((m: any) => m.round));
    const rounds: any[][] = [];
    for (let r = 1; r <= maxRound; r++) {
      rounds.push(raw.filter((m: any) => m.round === r));
    }
    return rounds;
  })();

  const hasBracket = bracketRounds.length > 0;

  const animatedBracketData = hasBracket
    ? {
        rounds: bracketRounds.map((round) =>
          round.map((m: any) => {
            const p1 = participants.find((p) => p.userId === m.homeUserId || p.userId === m.player1Id);
            const p2 = participants.find((p) => p.userId === m.awayUserId || p.userId === m.player2Id);
            const winnerId = m.winnerId || m.winner_id;
            const winner = winnerId ? participants.find((p) => p.userId === winnerId) : null;
            return {
              id: m.id,
              round: m.round,
              position: m.matchIndex ?? m.position ?? 0,
              player1: p1 ? { id: p1.userId, name: p1.displayName || p1.username, seed: p1.seed } : null,
              player2: p2 ? { id: p2.userId, name: p2.displayName || p2.username, seed: p2.seed } : null,
              winner: winner ? { id: winner.userId, name: winner.displayName || winner.username, seed: winner.seed } : null,
              score1: m.score1 != null ? Number(m.score1) : null,
              score2: m.score2 != null ? Number(m.score2) : null,
              status: m.status === "COMPLETED" ? "COMPLETED" as const : m.status === "LIVE" ? "LIVE" as const : "PENDING" as const,
            };
          })
        ),
        totalRounds: bracketRounds.length,
        title: tournament.name,
      }
    : null;

  const tabs = [
    { id: "matchday", label: "Matchday" },
    ...(animatedBracketData ? [{ id: "bracket", label: "Bracket" }] : []),
    ...(groups.length > 0 ? [{ id: "groups", label: "Standings" }] : []),
    { id: "matches", label: "All Matches" },
    { id: "participants", label: `Players (${participants.length})` },
  ];

  async function handleRegister() {
    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Tournaments
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="frosted-card-sm rounded-[24px] p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(18,20,24,0.7), rgba(18,20,24,0.4))",
          border: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              tournament.status === "LIVE"
                ? "radial-gradient(600px 300px at 30% 20%, rgba(0,255,133,0.06), transparent 70%)"
                : "radial-gradient(600px 300px at 30% 20%, rgba(255,184,0,0.04), transparent 70%)",
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${statusColor}`}>
              {statusLabel}
            </span>
            <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">
              {typeLabel}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="cinematic-heading text-3xl sm:text-5xl text-ink leading-[0.88]">
                {tournament.name}
              </h1>
              <p className="text-sm text-muted-soft mt-2 flex items-center gap-2">
                <ShieldIcon />
                Hosted by {organizerName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="cinematic-heading text-2xl sm:text-3xl text-ink tabular-nums leading-none">
                {participants.length}/{tournament.maxPlayers}
              </p>
              <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mt-0.5">Players</p>
            </div>
          </div>

          {tournament.description && (
            <p className="text-sm text-ink-soft leading-relaxed mt-4 max-w-2xl">
              {tournament.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-5">
            {tournament.prizePool > 0 && (
              <span className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent">
                <TrophyIcon />
                ${(tournament.prizePool / 100).toFixed(2)} prize
              </span>
            )}
            {tournament.entryFee > 0 && (
              <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-gold/5 border border-gold/15 text-gold">
                ${(tournament.entryFee / 100).toFixed(2)} entry
              </span>
            )}
            {tournament.startAt && (
              <span className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-cyan/5 border border-cyan/15 text-cyan">
                <CalendarIcon />
                {new Date(tournament.startAt).toLocaleDateString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                })}
              </span>
            )}
            {tournament.settings && (
              <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-emerald/5 border border-emerald/15 text-emerald">
                {String((tournament.settings as any).halfLengthMinutes ?? "-")} min / {(tournament.settings as any).gameSpeed ?? "Normal"}
              </span>
            )}
          </div>

          {canRegister && (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="mt-5 w-full sm:w-auto h-12 px-8 rounded-[16px] cta-primary font-bold text-sm tracking-[0.18em] uppercase text-[#0D0D0F] disabled:opacity-50"
            >
              {registering ? "Registering..." : tournament.entryFee > 0 ? `Register — $${(tournament.entryFee / 100).toFixed(2)}` : "Register — Free"}
            </button>
          )}
        </div>
      </motion.div>

      {tabs.length > 1 && (
        <div className="flex gap-1 p-1 rounded-[14px] overflow-x-auto bc-no-scrollbar" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-4 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${
                activeTab === t.id
                  ? "bg-accent/15 text-accent"
                  : "text-muted-soft hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "matchday" && (
          <motion.div
            key="matchday"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <MatchdayHub
              tournament={tournament}
              participants={participants}
              groups={groups}
              matches={matches}
              isOrganizer={isOrganizer}
            />
          </motion.div>
        )}

        {activeTab === "bracket" && animatedBracketData && (
          <motion.div
            key="bracket"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="glass rounded-[24px] p-4 sm:p-6 overflow-hidden">
              <AnimatedBracket bracket={animatedBracketData} />
            </div>
          </motion.div>
        )}

        {activeTab === "groups" && groups.length > 0 && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => {
                const sorted = [...group.standings].sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  const gdA = a.goalsFor - a.goalsAgainst;
                  const gdB = b.goalsFor - b.goalsAgainst;
                  if (gdB !== gdA) return gdB - gdA;
                  return b.goalsFor - a.goalsFor;
                });
                return (
                  <div key={group.id} className="frosted-card-sm rounded-[16px] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border">
                      <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-accent">{group.name}</h3>
                    </div>
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="border-b border-border text-[9px] font-bold uppercase tracking-wider text-muted-faint">
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">Player</th>
                          <th className="px-3 py-2 text-center">P</th>
                          <th className="px-3 py-2 text-center">W</th>
                          <th className="px-3 py-2 text-center">D</th>
                          <th className="px-3 py-2 text-center">L</th>
                          <th className="px-3 py-2 text-center">GF</th>
                          <th className="px-3 py-2 text-center">GA</th>
                          <th className="px-3 py-2 text-center">GD</th>
                          <th className="px-3 py-2 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((s, i) => {
                          const qualified = i < 2;
                          return (
                            <tr key={s.userId} className={`${i % 2 === 0 ? "bg-white/[0.02]" : ""} ${qualified ? "border-l-2 border-accent" : ""} hover:bg-white/[0.03]`}>
                              <td className={`px-3 py-2 font-mono tabular-nums ${qualified ? "text-accent" : "text-muted-faint"}`}>{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-ink truncate max-w-[120px]">{s.displayName ?? s.username ?? "Player"}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-soft">{s.played}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-accent">{s.wins}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-gold">{s.draws}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-negative">{s.losses}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-ink">{s.goalsFor}</td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums text-muted-soft">{s.goalsAgainst}</td>
                              <td className={`px-3 py-2 text-center font-mono tabular-nums ${s.goalDifference > 0 ? "text-accent" : s.goalDifference < 0 ? "text-negative" : "text-muted-soft"}`}>
                                {s.goalDifference > 0 ? "+" : ""}{s.goalDifference}
                              </td>
                              <td className="px-3 py-2 text-center font-mono tabular-nums font-bold text-ink">{s.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            {matches.length === 0 ? (
              <div className="glass rounded-[24px] p-10 text-center">
                <p className="text-sm text-muted-soft">No matches scheduled yet</p>
              </div>
            ) : (
              matches.map((m, i) => {
                const isComplete = m.status === "COMPLETED";
                const isLive = m.status === "LIVE";
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`frosted-card-sm p-4 rounded-[16px] transition-all ${isLive ? "border-accent/20" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 text-right">
                        <p className={`text-sm font-bold truncate ${m.winner?.id === m.player1?.id ? "text-accent" : "text-ink"}`}>
                          {m.player1?.displayName || m.player1?.username || "TBD"}
                        </p>
                        {(() => {
                          const p = participants.find((p) => p.userId === m.player1?.id);
                          return p?.assignedTeam ? <p className="text-[9px] text-muted-faint truncate">{p.assignedTeam}</p> : null;
                        })()}
                      </div>
                      <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                        {isComplete && m.score1 !== null ? (
                          <span className="font-mono text-lg font-bold tabular-nums text-ink">{m.score1}–{m.score2}</span>
                        ) : isLive ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />Live
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-faint uppercase tracking-wider">vs</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${m.winner?.id === m.player2?.id ? "text-accent" : "text-ink"}`}>
                          {m.player2?.displayName || m.player2?.username || "TBD"}
                        </p>
                        {(() => {
                          const p = participants.find((p) => p.userId === m.player2?.id);
                          return p?.assignedTeam ? <p className="text-[9px] text-muted-faint truncate">{p.assignedTeam}</p> : null;
                        })()}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeTab === "participants" && (
          <motion.div
            key="participants"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-1"
          >
            {participants.length === 0 ? (
              <div className="glass rounded-[24px] p-10 text-center">
                <p className="text-sm text-muted-soft">No participants yet</p>
              </div>
            ) : (
              participants.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-[14px] transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <span className="text-[10px] font-mono tabular-nums text-muted-faint w-6">{p.seed}.</span>
                  <div
                    className="h-8 w-8 rounded-[10px] shrink-0 grid place-items-center text-[11px] font-bold"
                    style={{
                      background: "rgba(0,255,133,0.06)",
                      border: "1px solid rgba(0,255,133,0.1)",
                      color: "var(--accent)",
                    }}
                  >
                    {(p.displayName || p.username)[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-ink truncate">{p.displayName || p.username}</span>
                  {p.assignedTeam && (
                    <span className="text-[9px] text-muted-soft bg-white/[0.03] px-2 py-0.5 rounded-[4px]">{p.assignedTeam}</span>
                  )}
                  <span className="ml-auto text-[8px] font-black uppercase tracking-wider text-muted-faint">{p.status}</span>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
