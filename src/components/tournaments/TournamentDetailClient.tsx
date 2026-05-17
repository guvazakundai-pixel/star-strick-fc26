"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AnimatedBracket } from "@/components/ui/AnimatedBracket";

type Participant = {
  id: string;
  userId: string;
  username: string;
  displayName?: string | null;
  seed: number;
  status: string;
};

type BracketMatch = {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  score1: number | null;
  score2: number | null;
  status: string;
};

type TournamentMatch = {
  id: string;
  round: number;
  position: number;
  player1: { id: string; username: string; displayName?: string | null } | null;
  player2: { id: string; username: string; displayName?: string | null } | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: string;
  scheduledAt?: string | null;
};

type TournamentDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  prizePool: number;
  entryFee: number;
  maxPlayers: number;
  description?: string | null;
  startAt?: string | null;
  createdAt: string;
  organizer: { id: string; username: string; displayName?: string | null };
};

type TournamentDetailClientProps = {
  tournament: TournamentDetail;
  participants?: Participant[];
  bracket?: { rounds: { id: string; round: number; position: number; player1Id: string | null; player2Id: string | null; winnerId: string | null; score1: number | null; score2: number | null; status: string }[][] } | null;
  matches?: TournamentMatch[];
  isOrganizer?: boolean;
  isParticipant?: boolean;
  onRegister?: () => void;
  onJoin?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onGenerateBracket?: () => void;
  onAdvanceMatch?: (matchId: string) => void;
  className?: string;
};

const typeLabels: Record<string, string> = {
  KNOCKOUT: "Single Elim",
  DOUBLE_ELIM: "Double Elim",
  ROUND_ROBIN: "Round Robin",
  GROUP_STAGE: "Group Stage",
};

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function TournamentDetailClient({
  tournament,
  participants = [],
  bracket,
  matches = [],
  isOrganizer = false,
  isParticipant = false,
  onRegister,
  onJoin,
  onEdit,
  onCancel,
  onGenerateBracket,
  onAdvanceMatch,
  className = "",
}: TournamentDetailClientProps) {
  const [activeTab, setActiveTab] = useState<string>("bracket");
  const canRegister = tournament.status === "REGISTRATION" && !isParticipant;

  const statusColor =
    tournament.status === "LIVE"
      ? "text-accent"
      : tournament.status === "REGISTRATION"
      ? "text-gold"
      : tournament.status === "COMPLETED"
      ? "text-muted-soft"
      : "text-muted-faint";

  const organizerName = tournament.organizer.displayName || tournament.organizer.username;

  const showGroups = tournament.type === "GROUP_STAGE" || tournament.type === "ROUND_ROBIN";

  const bracketRounds = bracket?.rounds ?? [];

  const animatedBracketData = bracketRounds.length > 0
    ? {
        rounds: bracketRounds.map((round) =>
          round.map((m) => {
            const p1 = participants.find((p) => p.userId === m.player1Id);
            const p2 = participants.find((p) => p.userId === m.player2Id);
            const winner = m.winnerId
              ? participants.find((p) => p.userId === m.winnerId)
              : null;
            return {
              id: m.id,
              round: m.round,
              position: m.position,
              player1: p1
                ? { id: p1.userId, name: p1.displayName || p1.username, seed: p1.seed }
                : null,
              player2: p2
                ? { id: p2.userId, name: p2.displayName || p2.username, seed: p2.seed }
                : null,
              winner: winner
                ? { id: winner.userId, name: winner.displayName || winner.username, seed: winner.seed }
                : null,
              score1: m.score1,
              score2: m.score2,
              status: m.status === "COMPLETED" ? "COMPLETED" as const : m.status === "LIVE" ? "LIVE" as const : "PENDING" as const,
            };
          })
        ),
        totalRounds: bracketRounds.length,
        title: tournament.name,
      }
    : null;

  const tabs = [
    ...(animatedBracketData ? [{ id: "bracket", label: "Bracket" }] : []),
    ...(showGroups ? [{ id: "groups", label: "Groups" }] : []),
    { id: "matches", label: "Matches" },
    { id: "participants", label: `Players (${participants.length})` },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Back link */}
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
        Tournaments
      </Link>

      {/* Header */}
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
              {tournament.status}
            </span>
            <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">
              {typeLabels[tournament.type] || tournament.type}
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
            <span className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent">
              <TrophyIcon />
              ${(tournament.prizePool / 100).toFixed(2)} prize
            </span>
            {tournament.entryFee > 0 && (
              <span className="inline-flex items-center rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-gold/5 border border-gold/15 text-gold">
                ${(tournament.entryFee / 100).toFixed(2)} entry
              </span>
            )}
            {tournament.startAt && (
              <span className="inline-flex items-center gap-1 rounded-[6px] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider bg-cyan/5 border border-cyan/15 text-cyan">
                <CalendarIcon />
                {new Date(tournament.startAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          {/* Register / Join */}
          {canRegister && onRegister && (
            <button
              onClick={onRegister}
              className="mt-5 w-full sm:w-auto h-12 px-8 rounded-[16px] cta-primary font-bold text-sm tracking-[0.18em] uppercase text-[#0D0D0F]"
            >
              {tournament.entryFee > 0
                ? `Register — $${(tournament.entryFee / 100).toFixed(2)}`
                : "Register — Free"}
            </button>
          )}

          {!isParticipant && !canRegister && tournament.status === "REGISTRATION" && (
            <p className="mt-3 text-[11px] text-muted-faint">Registration is full</p>
          )}

          {isParticipant && (
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Registered
            </p>
          )}
        </div>
      </motion.div>

      {/* Admin Controls */}
      {isOrganizer && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {onEdit && (
            <button
              onClick={onEdit}
              className="h-9 px-4 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
            >
              Edit
            </button>
          )}
          {onGenerateBracket && (
            <button
              onClick={onGenerateBracket}
              className="h-9 px-4 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-cyan/10 text-cyan border border-cyan/20 hover:bg-cyan/20 transition-all"
            >
              Generate Bracket
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="h-9 px-4 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-negative/10 text-negative border border-negative/20 hover:bg-negative/20 transition-all"
            >
              Cancel Tournament
            </button>
          )}
        </motion.div>
      )}

      {/* Tabs */}
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
        {/* Bracket */}
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

        {/* Groups (placeholder for now) */}
        {activeTab === "groups" && (
          <motion.div
            key="groups"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="glass rounded-[24px] p-6 text-center">
              <p className="text-sm text-muted-soft mb-4">Group Stage</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["Group A", "Group B", "Group C", "Group D"].slice(0, Math.ceil(participants.length / 4)).map((group) => (
                  <div key={group} className="frosted-card-sm p-4 rounded-[16px]">
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase text-accent mb-3">{group}</p>
                    <div className="space-y-1.5">
                      {participants.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex items-center gap-2 text-[12px] text-ink">
                          <span className="text-muted-faint font-mono text-[10px] w-4">{p.seed}</span>
                          <span className="truncate">{p.displayName || p.username}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Matches Schedule */}
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
                    className={`frosted-card-sm p-4 rounded-[16px] transition-all ${
                      isLive ? "border-accent/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 text-right">
                        <p className={`text-sm font-bold truncate ${m.winnerId === m.player1?.id ? "text-accent" : "text-ink"}`}>
                          {m.player1?.displayName || m.player1?.username || "TBD"}
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col items-center min-w-[60px]">
                        {isComplete && m.score1 !== null && m.score2 !== null ? (
                          <span className="font-mono text-lg font-bold tabular-nums text-ink">
                            {m.score1}–{m.score2}
                          </span>
                        ) : isLive ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-faint uppercase tracking-wider">vs</span>
                        )}
                        {m.scheduledAt && !isComplete && (
                          <span className="text-[8px] text-muted-faint mt-0.5">
                            {new Date(m.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${m.winnerId === m.player2?.id ? "text-accent" : "text-ink"}`}>
                          {m.player2?.displayName || m.player2?.username || "TBD"}
                        </p>
                      </div>
                    </div>
                    {m.status === "READY" && isOrganizer && onAdvanceMatch && (
                      <button
                        onClick={() => onAdvanceMatch(m.id)}
                        className="mt-2 w-full text-center py-1.5 rounded-[8px] text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                      >
                        Advance Match
                      </button>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* Participants */}
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
                  <span className="text-[9px] text-muted-soft lowercase">@{p.username}</span>
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
