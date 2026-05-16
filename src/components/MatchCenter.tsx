"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { simulateXPReport, calculateXPAndPoints, calculateElo } from "@/lib/xp-engine";
import { ChallengeModal } from "@/components/match/ChallengeModal";

type View = "center" | "challenge" | "challenge-lobby" | "score-submit" | "verify" | "verified" | "dispute" | "tournament" | "bracket";

type MatchState = "idle" | "challenge_sent" | "accepted" | "in_progress" | "score_submitted" | "pending_verification" | "verified" | "disputed";

type MockPlayer = {
  id: string;
  name: string;
  gamertag: string;
  rating: number;
  points: number;
  streak: number;
  matches: number;
};

type TournamentMatch = {
  id: string;
  round: number;
  position: number;
  player1: MockPlayer | null;
  player2: MockPlayer | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: "upcoming" | "live" | "completed";
};

const MOCK_PLAYERS: MockPlayer[] = [
  { id: "p1", name: "Wilfred Chigwende", gamertag: "WILFY-Z", rating: 1850, points: 3120, streak: 12, matches: 100 },
  { id: "p2", name: "Ashly Marimo", gamertag: "ASH-MAR", rating: 1790, points: 3085, streak: 4, matches: 100 },
  { id: "p3", name: "Kundai Guvaza", gamertag: "KUNDAI", rating: 1720, points: 2980, streak: 0, matches: 98 },
  { id: "p4", name: "Farai Chikomo", gamertag: "FARABALL", rating: 1680, points: 2842, streak: 9, matches: 99 },
];

const INITIAL_BRACKET: TournamentMatch[] = [
  { id: "qf1", round: 1, position: 1, player1: MOCK_PLAYERS[0], player2: MOCK_PLAYERS[3], score1: null, score2: null, winnerId: null, status: "upcoming" },
  { id: "qf2", round: 1, position: 2, player1: MOCK_PLAYERS[1], player2: MOCK_PLAYERS[2], score1: null, score2: null, winnerId: null, status: "upcoming" },
  { id: "sf1", round: 2, position: 1, player1: null, player2: null, score1: null, score2: null, winnerId: null, status: "upcoming" },
  { id: "sf2", round: 2, position: 2, player1: null, player2: null, score1: null, score2: null, winnerId: null, status: "upcoming" },
  { id: "final", round: 3, position: 1, player1: null, player2: null, score1: null, score2: null, winnerId: null, status: "upcoming" },
];

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function SwordsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2 2" />
      <path d="M21 3l-6 6" /><path d="M6.5 9.5L3 6" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
      <path d="M6 9H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M6 4h12v5a6 6 0 0 1-12 0V4z" /><path d="M12 15v3" /><path d="M8 21h8" />
      <path d="M8 4v1" /><path d="M16 4v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" /><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
      <path d="M8.56 13.07A8 8 0 0 0 12 20a8 8 0 0 0 3.44-6.93" /><circle cx="12" cy="6" r="2" />
    </svg>
  );
}

export function MatchCenter() {
  const [view, setView] = useState<View>("center");
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [matchState, setMatchState] = useState<MatchState>("idle");
  const [selectedOpponent, setSelectedOpponent] = useState<MockPlayer | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [submittingPlayer, setSubmittingPlayer] = useState<"p1" | "p2">("p1");
  const [xpReport, setXpReport] = useState<string | null>(null);
  const [bracket, setBracket] = useState<TournamentMatch[]>(INITIAL_BRACKET);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [tournScore1, setTournScore1] = useState(0);
  const [tournScore2, setTournScore2] = useState(0);

  const currentUser = MOCK_PLAYERS[2];

  const handleSendChallenge = useCallback(() => {
    if (!selectedOpponent) return;
    setMatchState("challenge_sent");
  }, [selectedOpponent]);

  const handleAcceptChallenge = useCallback(() => {
    setMatchState("accepted");
  }, []);

  const handleStartMatch = useCallback(() => {
    setMatchState("in_progress");
  }, []);

  const handleSubmitScore = useCallback(() => {
    setSubmittingPlayer("p1");
    setMatchState("score_submitted");
    setMatchState("pending_verification");
  }, []);

  const handleConfirmResult = useCallback(() => {
    setMatchState("verified");

    const isP1Winner = score1 > score2;
    const winnerRating = isP1Winner ? currentUser.rating : (selectedOpponent?.rating ?? 1500);
    const loserRating = isP1Winner ? (selectedOpponent?.rating ?? 1500) : currentUser.rating;
    const wScore = Math.max(score1, score2);
    const lScore = Math.min(score1, score2);
    const wStreak = isP1Winner ? currentUser.streak : (selectedOpponent?.streak ?? 0);

    const result = calculateXPAndPoints(
      winnerRating, loserRating, wScore, lScore,
      isP1Winner ? currentUser.id : (selectedOpponent?.id ?? ""),
      isP1Winner ? (selectedOpponent?.id ?? "") : currentUser.id,
      wStreak, isP1Winner ? currentUser.points : (selectedOpponent?.points ?? 0),
      isP1Winner ? (selectedOpponent?.points ?? 0) : currentUser.points,
    );
    setXpReport(result.description);
  }, [score1, score2, currentUser, selectedOpponent]);

  const handleDispute = useCallback(() => {
    setMatchState("disputed");
  }, []);

  const advanceBracket = useCallback((matchId: string, s1: number, s2: number) => {
    setBracket((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== matchId) return m;
        const winner = s1 > s2 ? m.player1 : s2 > s1 ? m.player2 : null;
        return { ...m, score1: s1, score2: s2, winnerId: winner?.id ?? null, status: "completed" as const };
      });

      const match = prev.find((m) => m.id === matchId);
      if (!match) return updated;
      const winner = s1 > s2 ? match.player1 : s2 > s1 ? match.player2 : null;

      if (match.round === 1) {
        const sfMatch = updated.find((m) => m.round === 2 && m.position === match.position);
        if (sfMatch && winner) {
          const updated2 = updated.map((m) => {
            if (m.id !== sfMatch.id) return m;
            return {
              ...m,
              player1: m.player1 ?? winner,
              status: m.player1 && m.player2 ? "upcoming" as const : "upcoming" as const,
            };
          });
          return updated2;
        }
      } else if (match.round === 2) {
        const finalMatch = updated.find((m) => m.round === 3);
        if (finalMatch && winner) {
          const updated2 = updated.map((m) => {
            if (m.id !== finalMatch.id) return m;
            const p1 = m.player1 ?? (match.position === 1 ? winner : null);
            const p2 = m.player2 ?? (match.position === 2 ? winner : null);
            return { ...m, player1: p1, player2: p2, status: p1 && p2 ? "upcoming" as const : "upcoming" as const };
          });
          return updated2;
        }
      }

      return updated;
    });
  }, []);

  const getMatchStateLabel = (state: MatchState): string => {
    switch (state) {
      case "idle": return "Ready";
      case "challenge_sent": return "Challenge Sent";
      case "accepted": return "Accepted";
      case "in_progress": return "Match In Progress";
      case "score_submitted": return "Score Submitted";
      case "pending_verification": return "Pending Verification";
      case "verified": return "Verified";
      case "disputed": return "Disputed";
    }
  };

  const getStateColor = (state: MatchState): string => {
    switch (state) {
      case "verified": return "text-accent";
      case "disputed": return "text-negative";
      case "pending_verification": return "text-gold";
      case "in_progress": return "text-cyan";
      default: return "text-muted-soft";
    }
  };

  return (
    <div className="broadcast-theme min-h-screen bc-grain pb-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
        {view !== "center" && (
          <button
            onClick={() => { setView("center"); setMatchState("idle"); setXpReport(null); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] uppercase text-muted-soft hover:text-accent transition-colors mb-6"
          >
            <ArrowLeftIcon />
            Back to Match Center
          </button>
        )}

        <AnimatePresence mode="wait">
          {view === "center" && (
            <motion.div key="center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/20 px-4 py-1.5 mb-4" style={{ background: "rgba(0,255,133,0.05)" }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">Match Center</span>
                </div>
                <h1 className="bc-headline text-4xl sm:text-6xl text-ink leading-[0.88]">
                  Choose Your<br />
                  <span className="text-gradient-accent">Battle.</span>
                </h1>
                <p className="mt-4 text-sm sm:text-[15px] text-muted-soft max-w-lg">
                  Challenge a friend head-to-head or enter a tournament bracket. Every match counts. Every win matters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <button
                  onClick={() => setChallengeModalOpen(true)}
                  className="group relative overflow-hidden rounded-[24px] text-left transition-all duration-400 hover:scale-[1.02]"
                  style={{ background: "rgba(18, 20, 24, 0.55)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(0,230,118,0.12)", boxShadow: "0 0 60px -12px rgba(0,230,118,0.14), 0 12px 40px rgba(0,0,0,0.20)" }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: "radial-gradient(400px 250px at 50% 30%, rgba(0,230,118,0.10), transparent 65%)", "--spotlight-max": "0.12" } as React.CSSProperties} />
                  <div className="relative z-10 p-6 sm:p-8">
                    <div className="h-14 w-14 rounded-[16px] grid place-items-center mb-5" style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.15), rgba(34,211,238,0.06))", border: "1px solid rgba(0,230,118,0.12)" }}>
                      <SwordsIcon />
                    </div>
                    <h2 className="bc-headline text-2xl sm:text-3xl text-ink leading-[0.9]">Direct<br />Challenge</h2>
                    <p className="mt-3 text-[13px] text-muted-soft leading-relaxed">
                      Challenge a friend or opponent. Submit scores, verify results, and let the XP engine do the rest.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-accent">
                      Start Match
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
                        <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setView("tournament")}
                  className="group relative overflow-hidden rounded-[24px] text-left transition-all duration-400 hover:scale-[1.02]"
                  style={{ background: "rgba(18, 20, 24, 0.55)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(168,85,247,0.12)", boxShadow: "0 0 60px -12px rgba(168,85,247,0.14), 0 12px 40px rgba(0,0,0,0.20)" }}
                >
                  <div aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: "radial-gradient(400px 250px at 50% 30%, rgba(168,85,247,0.10), transparent 65%)", "--spotlight-max": "0.12" } as React.CSSProperties} />
                  <div className="relative z-10 p-6 sm:p-8">
                    <div className="h-14 w-14 rounded-[16px] grid place-items-center mb-5" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.06))", border: "1px solid rgba(168,85,247,0.12)" }}>
                      <TrophyIcon />
                    </div>
                    <h2 className="bc-headline text-2xl sm:text-3xl" style={{ color: "#c084fc", lineHeight: 0.9 }}>Tournament<br />Arena</h2>
                    <p className="mt-3 text-[13px] text-muted-soft leading-relaxed">
                      Enter a knockout bracket. Quarter-finals to grand finals. Only one champion lifts the trophy.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "#c084fc" }}>
                      Enter Bracket
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1">
                        <path d="M5 12h14" /><path d="M13 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-8">
                <h3 className="bc-headline text-lg text-ink mb-3">XP &amp; Elo System</h3>
                <div className="frosted-card-sm p-5 rounded-[20px] space-y-2.5 text-[12px] text-muted-soft leading-relaxed">
                  <p><span className="text-accent font-bold">Giant Slayer:</span> Beat a higher-rated opponent for massive XP gains. Farm lower-ranked players for minimal reward.</p>
                  <p><span className="text-cyan font-bold">Clean Sheet:</span> Keep a clean sheet (0 goals conceded) for +5 XP.</p>
                  <p><span className="text-purple font-bold">Dominant Win:</span> Win by 3+ goals for +5 XP bonus.</p>
                  <p><span className="text-gold font-bold">Win Streak:</span> Win 3+ in a row for escalating streak bonuses (up to +15).</p>
                </div>
              </div>
            </motion.div>
          )}

          {view === "challenge" && (
            <motion.div key="challenge" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              {matchState === "idle" && (
                <div>
                  <h2 className="bc-headline text-3xl sm:text-4xl text-ink mb-2">Select Opponent</h2>
                  <p className="text-sm text-muted-soft mb-6">Choose a player to challenge to a direct match.</p>
                  <div className="space-y-3">
                    {MOCK_PLAYERS.filter((p) => p.id !== currentUser.id).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedOpponent(p); handleSendChallenge(); }}
                        className="w-full text-left frosted-card-sm p-4 rounded-[18px] hover:border-accent/20 transition-all duration-300 group"
                        style={{ background: selectedOpponent?.id === p.id ? "rgba(0,230,118,0.06)" : undefined, border: selectedOpponent?.id === p.id ? "1px solid rgba(0,230,118,0.20)" : undefined }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-[14px] shrink-0 grid place-items-center" style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.10), rgba(34,211,238,0.04))", border: "1px solid rgba(0,255,133,0.12)" }}>
                            <span className="bc-headline text-lg text-accent">{p.gamertag[0]}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors">{p.gamertag}</p>
                            <p className="text-[11px] text-muted-soft">{p.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="bc-mono-score text-sm font-bold text-ink">{p.rating} <span className="text-[9px] text-muted-faint">SR</span></p>
                            <p className="text-[10px] text-muted-soft">{p.points.toLocaleString()} pts</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchState === "challenge_sent" && selectedOpponent && (
                <div className="text-center space-y-6 py-8">
                  <div className="bc-pulse-cta inline-flex h-16 w-16 rounded-full items-center justify-center" style={{ background: "rgba(0,255,133,0.08)", boxShadow: "0 0 40px rgba(0,255,133,0.20)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-accent">
                      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </div>
                  <h2 className="bc-headline text-2xl text-ink">Challenge Sent!</h2>
                  <p className="text-sm text-muted-soft">Waiting for <span className="text-accent font-bold">{selectedOpponent.gamertag}</span> to respond...</p>
                  <button onClick={handleAcceptChallenge} className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-8 font-bold text-[#0D0D0F] text-sm tracking-wider">
                    Simulate Accept (Demo)
                  </button>
                </div>
              )}

              {(matchState === "accepted" || matchState === "in_progress") && selectedOpponent && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.15)" }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan bc-live-dot" />
                      <span className="text-[10px] font-black tracking-[0.25em] uppercase text-cyan">
                        {matchState === "accepted" ? "READY" : "MATCH IN PROGRESS"}
                      </span>
                    </div>
                  </div>

                  <div className="frosted-card p-6 sm:p-8 rounded-[24px] text-center space-y-4">
                    <div className="flex items-center justify-center gap-4 sm:gap-8">
                      <div className="text-center">
                        <p className="bc-headline text-xl sm:text-2xl text-ink">{currentUser.gamertag}</p>
                        <p className="bc-mono-score text-[11px] text-muted-soft">{currentUser.rating} SR</p>
                      </div>
                      <div className="text-[11px] font-black tracking-[0.3em] uppercase text-muted-faint">VS</div>
                      <div className="text-center">
                        <p className="bc-headline text-xl sm:text-2xl text-ink">{selectedOpponent.gamertag}</p>
                        <p className="bc-mono-score text-[11px] text-muted-soft">{selectedOpponent.rating} SR</p>
                      </div>
                    </div>

                    {matchState === "accepted" && (
                      <button onClick={handleStartMatch} className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-8 font-bold text-[#0D0D0F] text-sm tracking-wider">
                        Start Match
                      </button>
                    )}

                    {matchState === "in_progress" && (
                      <div className="space-y-4 pt-4 border-t border-border-faint">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-soft">Submit Final Score</p>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] font-bold tracking-wider uppercase text-muted-soft mb-2">{currentUser.gamertag}</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setScore1(Math.max(0, score1 - 1))} className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg">−</button>
                              <span className="bc-headline text-3xl tabular-nums text-ink w-12 text-center">{score1}</span>
                              <button onClick={() => setScore1(score1 + 1)} className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg">+</button>
                            </div>
                          </div>
                          <span className="text-2xl font-bold text-muted-faint">:</span>
                          <div className="text-center">
                            <p className="text-[10px] font-bold tracking-wider uppercase text-muted-soft mb-2">{selectedOpponent.gamertag}</p>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setScore2(Math.max(0, score2 - 1))} className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg">−</button>
                              <span className="bc-headline text-3xl tabular-nums text-ink w-12 text-center">{score2}</span>
                              <button onClick={() => setScore2(score2 + 1)} className="h-10 w-10 rounded-[10px] bg-bg-elevated border border-border text-ink font-bold text-lg">+</button>
                            </div>
                          </div>
                        </div>
                        <button onClick={handleSubmitScore} disabled={score1 === 0 && score2 === 0} className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-8 font-bold text-[#0D0D0F] text-sm tracking-wider disabled:opacity-40 disabled:cursor-not-allowed">
                          Submit Score
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {matchState === "pending_verification" && selectedOpponent && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.15)" }}>
                      <AlertTriangleIcon />
                      <span className="text-[10px] font-black tracking-[0.25em] uppercase text-gold">PENDING VERIFICATION</span>
                    </div>
                  </div>

                  <div className="frosted-card p-6 sm:p-8 rounded-[24px] text-center space-y-5">
                    <p className="text-sm text-muted-soft">
                      <span className="text-ink font-semibold">{currentUser.gamertag}</span> has reported the score as:
                    </p>
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-center">
                        <p className="bc-headline text-4xl tabular-nums text-ink">{score1}</p>
                        <p className="text-[10px] font-bold tracking-wider uppercase text-muted-soft mt-1">{currentUser.gamertag}</p>
                      </div>
                      <span className="text-2xl font-bold text-muted-faint">—</span>
                      <div className="text-center">
                        <p className="bc-headline text-4xl tabular-nums text-ink">{score2}</p>
                        <p className="text-[10px] font-bold tracking-wider uppercase text-muted-soft mt-1">{selectedOpponent.gamertag}</p>
                      </div>
                    </div>

                    <p className="text-[13px] text-muted-soft italic">{selectedOpponent.gamertag}, do you confirm these results?</p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button onClick={handleConfirmResult} className="inline-flex items-center justify-center gap-2 h-12 rounded-[18px] px-8 font-bold text-sm tracking-wider transition-all duration-300" style={{ background: "linear-gradient(135deg, #00E676, #00ff85)", color: "#0D0D0F", boxShadow: "0 0 40px rgba(0,230,118,0.30)" }}>
                        <CheckIcon />
                        CONFIRM RESULTS
                      </button>
                      <button onClick={handleDispute} className="inline-flex items-center justify-center gap-2 h-12 rounded-[18px] px-8 font-bold text-sm tracking-wider transition-all duration-200" style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.18)", color: "#ff4d4d" }}>
                        DISPUTE
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {matchState === "verified" && selectedOpponent && xpReport && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5" style={{ background: "rgba(0,255,133,0.08)", border: "1px solid rgba(0,255,133,0.15)" }}>
                      <CheckIcon />
                      <span className="text-[10px] font-black tracking-[0.25em] uppercase text-accent">VERIFIED</span>
                    </div>
                  </div>

                  <div className="frosted-card p-6 sm:p-8 rounded-[24px] space-y-5">
                    <div className="flex items-center justify-center gap-6">
                      <div className={`text-center ${score1 > score2 ? "" : "opacity-50"}`}>
                        <p className={`bc-headline text-5xl tabular-nums ${score1 > score2 ? "text-accent" : "text-ink"}`}>{score1}</p>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-soft mt-1">{currentUser.gamertag}</p>
                        {score1 > score2 && <span className="text-[9px] font-black uppercase text-accent">WINNER</span>}
                      </div>
                      <span className="text-2xl font-bold text-muted-faint">—</span>
                      <div className={`text-center ${score2 > score1 ? "" : "opacity-50"}`}>
                        <p className={`bc-headline text-5xl tabular-nums ${score2 > score1 ? "text-accent" : "text-ink"}`}>{score2}</p>
                        <p className="text-[11px] font-bold tracking-wider uppercase text-muted-soft mt-1">{selectedOpponent.gamertag}</p>
                        {score2 > score1 && <span className="text-[9px] font-black uppercase text-accent">WINNER</span>}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border-faint">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="h-7 w-7 rounded-[8px] grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.12), rgba(34,211,238,0.06))", border: "1px solid rgba(0,230,118,0.14)" }}>
                          <BrainIcon />
                        </div>
                        <p className="text-[10px] font-black tracking-[0.25em] uppercase text-accent">XP Analysis</p>
                      </div>
                      <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed">{xpReport}</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <button onClick={() => { setView("center"); setMatchState("idle"); setXpReport(null); }} className="inline-flex items-center justify-center h-11 rounded-[14px] cta-outline px-6 font-bold text-sm text-ink">
                      Back to Match Center
                    </button>
                  </div>
                </div>
              )}

              {matchState === "disputed" && (
                <div className="text-center space-y-6 py-8">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-full" style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.12)" }}>
                    <AlertTriangleIcon />
                  </div>
                  <h2 className="bc-headline text-2xl text-ink">Match Disputed</h2>
                  <p className="text-sm text-muted-soft max-w-sm mx-auto">The score has been flagged for review. An admin will investigate and resolve this match.</p>
                  <button onClick={() => { setView("center"); setMatchState("idle"); }} className="inline-flex items-center justify-center h-11 rounded-[14px] cta-outline px-6 font-bold text-sm text-ink">
                    Back to Match Center
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {view === "tournament" && (
            <motion.div key="tournament" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.14)" }}>
                  <TrophyIcon />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: "#c084fc" }}>Knockout Bracket</span>
                </div>
                <h2 className="bc-headline text-3xl sm:text-4xl text-ink leading-[0.88]">
                  Star Strick<br />
                  <span className="text-gradient-pink">Champions Cup</span>
                </h2>
                <p className="mt-3 text-sm text-muted-soft">4 players. Single elimination. One champion.</p>
              </div>

              <TournamentBracket
                bracket={bracket}
                activeMatchId={activeMatchId}
                onPlayMatch={(matchId) => { setActiveMatchId(matchId); setTournScore1(0); setTournScore2(0); }}
                score1={tournScore1}
                score2={tournScore2}
                onSetScore1={setTournScore1}
                onSetScore2={setTournScore2}
                onConfirmMatch={() => {
                  if (!activeMatchId) return;
                  advanceBracket(activeMatchId, tournScore1, tournScore2);
                  setActiveMatchId(null);
                  setTournScore1(0);
                  setTournScore2(0);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TournamentBracket({
  bracket,
  activeMatchId,
  onPlayMatch,
  score1,
  score2,
  onSetScore1,
  onSetScore2,
  onConfirmMatch,
}: {
  bracket: TournamentMatch[];
  activeMatchId: string | null;
  onPlayMatch: (id: string) => void;
  score1: number;
  score2: number;
  onSetScore1: (s: number) => void;
  onSetScore2: (s: number) => void;
  onConfirmMatch: () => void;
}) {
  const qf = bracket.filter((m) => m.round === 1);
  const sf = bracket.filter((m) => m.round === 2);
  const final = bracket.find((m) => m.round === 3);
  const champion = bracket.find((m) => m.round === 3 && m.status === "completed");

  return (
    <div className="frosted-card p-4 sm:p-6 rounded-[24px]">
      <div className="flex flex-col gap-6 sm:gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-muted-faint mb-3">Semi-Finals</p>
          <div className="space-y-2">
            {qf.map((match) => (
              <BracketNode
                key={match.id}
                match={match}
                isActive={activeMatchId === match.id}
                onPlay={() => onPlayMatch(match.id)}
                score1={score1}
                score2={score2}
                onSetScore1={onSetScore1}
                onSetScore2={onSetScore2}
                onConfirm={onConfirmMatch}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-px h-6" style={{ background: "linear-gradient(180deg, rgba(168,85,247,0.20), rgba(168,85,247,0.05))" }} />
        </div>

        <div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-muted-faint mb-3">Finals</p>
          <div className="space-y-2">
            {sf.map((match) => (
              <BracketNode
                key={match.id}
                match={match}
                isActive={activeMatchId === match.id}
                onPlay={() => onPlayMatch(match.id)}
                score1={score1}
                score2={score2}
                onSetScore1={onSetScore1}
                onSetScore2={onSetScore2}
                onConfirm={onConfirmMatch}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-px h-6" style={{ background: "linear-gradient(180deg, rgba(255,184,0,0.25), rgba(255,184,0,0.05))" }} />
        </div>

        <div>
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-gold mb-3">Grand Final</p>
          {final && (
            <BracketNode
              match={final}
              isActive={activeMatchId === final.id}
              onPlay={() => onPlayMatch(final.id)}
              score1={score1}
              score2={score2}
              onSetScore1={onSetScore1}
              onSetScore2={onSetScore2}
              onConfirm={onConfirmMatch}
            />
          )}
        </div>

        {champion && champion.winnerId && (
          <div className="text-center pt-4 border-t border-border-faint">
            <p className="text-[10px] font-black tracking-[0.25em] uppercase text-gold mb-2">Champion</p>
            <p className="bc-headline text-2xl text-gold">
              {MOCK_PLAYERS.find((p) => p.id === champion.winnerId)?.gamertag ?? "TBD"}
            </p>
          </div>
        )}
      </div>
      <ChallengeModal
        open={challengeModalOpen}
        onClose={() => setChallengeModalOpen(false)}
      />
    </div>
  );
}

function BracketNode({
  match,
  isActive,
  onPlay,
  score1,
  score2,
  onSetScore1,
  onSetScore2,
  onConfirm,
}: {
  match: TournamentMatch;
  isActive: boolean;
  onPlay: () => void;
  score1: number;
  score2: number;
  onSetScore1: (s: number) => void;
  onSetScore2: (s: number) => void;
  onConfirm: () => void;
}) {
  const p1 = match.player1;
  const p2 = match.player2;

  if (!p1 && !p2) {
    return (
      <div className="rounded-[14px] p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[11px] text-muted-faint text-center">TBD</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[14px] overflow-hidden transition-all duration-300 ${isActive ? "ring-1 ring-accent/30" : ""}`}
      style={{
        background: match.status === "completed" ? "rgba(0,255,133,0.03)" : "rgba(18,20,24,0.50)",
        border: `1px solid ${match.status === "completed" ? "rgba(0,255,133,0.15)" : "rgba(255,255,255,0.05)"}`,
      }}
    >
      {[
        { player: p1, score: match.score1, isWinner: match.winnerId === p1?.id, isLoser: match.status === "completed" && match.winnerId !== p1?.id },
        { player: p2, score: match.score2, isWinner: match.winnerId === p2?.id, isLoser: match.status === "completed" && match.winnerId !== p2?.id },
      ].map(({ player, score, isWinner, isLoser }, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-3 px-3 sm:px-4 py-2.5 ${idx === 0 ? "border-b border-border-faint" : ""} ${isLoser ? "opacity-50" : ""}`}
        >
          <div className="h-7 w-7 rounded-[8px] shrink-0 grid place-items-center text-[11px] font-bold" style={{ background: isWinner ? "rgba(0,255,133,0.10)" : "rgba(255,255,255,0.03)", border: `1px solid ${isWinner ? "rgba(0,255,133,0.18)" : "rgba(255,255,255,0.04)"}`, color: isWinner ? "#00ff85" : "#8E909A" }}>
            {player ? player.gamertag[0] : "?"}
          </div>
          <p className={`flex-1 text-sm font-semibold truncate ${isWinner ? "text-accent" : "text-ink"} ${!player ? "text-muted-faint" : ""}`}>
            {player?.gamertag ?? "TBD"}
          </p>
          {isWinner && <span className="text-[9px] font-black uppercase text-accent">W</span>}
          {score !== null && score !== undefined && (
            <span className={`bc-mono-score text-sm font-bold tabular-nums ${isWinner ? "text-accent" : "text-ink"}`}>{score}</span>
          )}
        </div>
      ))}

      {match.status === "upcoming" && p1 && p2 && (
        <div className="px-3 pb-3 pt-2">
          <button
            onClick={isActive ? onConfirm : onPlay}
            className="w-full text-center text-[10px] font-bold tracking-[0.2em] uppercase py-2 rounded-[8px] transition-all duration-200"
            style={{
              background: isActive ? "linear-gradient(135deg, #00E676, #00ff85)" : "rgba(255,255,255,0.03)",
              color: isActive ? "#0D0D0F" : "var(--muted-soft)",
              border: isActive ? "none" : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {isActive ? "Confirm Score" : "Play Match"}
          </button>
          {isActive && (
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="text-center">
                <p className="text-[9px] text-muted-faint mb-1">{p1.gamertag}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => onSetScore1(Math.max(0, score1 - 1))} className="h-7 w-7 rounded-[6px] bg-bg-elevated border border-border text-ink text-xs font-bold">−</button>
                  <span className="bc-headline text-xl tabular-nums text-ink w-8 text-center">{score1}</span>
                  <button onClick={() => onSetScore1(score1 + 1)} className="h-7 w-7 rounded-[6px] bg-bg-elevated border border-border text-ink text-xs font-bold">+</button>
                </div>
              </div>
              <span className="text-sm text-muted-faint font-bold">vs</span>
              <div className="text-center">
                <p className="text-[9px] text-muted-faint mb-1">{p2.gamertag}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => onSetScore2(Math.max(0, score2 - 1))} className="h-7 w-7 rounded-[6px] bg-bg-elevated border border-border text-ink text-xs font-bold">−</button>
                  <span className="bc-headline text-xl tabular-nums text-ink w-8 text-center">{score2}</span>
                  <button onClick={() => onSetScore2(score2 + 1)} className="h-7 w-7 rounded-[6px] bg-bg-elevated border border-border text-ink text-xs font-bold">+</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}