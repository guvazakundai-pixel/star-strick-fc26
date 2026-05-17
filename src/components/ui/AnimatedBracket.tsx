"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type BracketParticipant = {
  id: string;
  name: string;
  avatar?: string;
  seed?: number;
};

type BracketMatchUI = {
  id: string;
  round: number;
  position: number;
  player1: BracketParticipant | null;
  player2: BracketParticipant | null;
  winner: BracketParticipant | null;
  score1: number | null;
  score2: number | null;
  status: "PENDING" | "READY" | "LIVE" | "COMPLETED";
};

type BracketData = {
  rounds: BracketMatchUI[][];
  totalRounds: number;
  title?: string;
};

export function AnimatedBracket({
  bracket,
  onMatchClick,
  className = "",
}: {
  bracket: BracketData;
  onMatchClick?: (match: BracketMatchUI) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showFinals, setShowFinals] = useState(false);

  useEffect(() => {
    setShowFinals(true);
  }, []);

  const matchHeight = 72;
  const matchGap = 16;
  const roundGap = 40;
  const matchWidth = 200;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const getRoundLabel = (roundIndex: number, totalRounds: number): string => {
    const diff = totalRounds - roundIndex;
    if (diff === 1) return "Final";
    if (diff === 2) return "Semi Finals";
    if (diff === 3) return "Quarter Finals";
    if (diff === 4) return "Round of 16";
    if (diff === 5) return "Round of 32";
    if (diff === 6) return "Round of 64";
    return `Round ${roundIndex + 1}`;
  };

  return (
    <div
      ref={scrollRef}
      className={`bracket-scroll ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ userSelect: isDragging ? "none" : undefined }}
    >
      <div className="inline-flex gap-10 min-h-full px-4 pb-4">
        {bracket.rounds.map((round, roundIndex) => {
          const totalRounds = bracket.rounds.length;
          const roundHeight = round.length * (matchHeight + matchGap) + matchGap;
          const isLastRound = roundIndex === totalRounds - 1;

          return (
            <div key={roundIndex} className="flex flex-col gap-4 relative min-w-[200px]">
              <div className="sticky top-0 z-10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-soft whitespace-nowrap px-2">
                    {getRoundLabel(roundIndex, totalRounds)}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                </div>
              </div>
              {round.map((match, matchIndex) => {
                const topOffset = (matchHeight + matchGap) * matchIndex + matchHeight / 2;
                const connectorHeight = matchHeight;

                return (
                  <div key={match.id} className="relative">
                    {!isLastRound && roundIndex < bracket.rounds.length - 1 && (
                      <div className="absolute right-[-41px] top-[36px] w-10" style={{ zIndex: 0 }}>
                        <svg width="40" height={connectorHeight * 2} className="text-border-strong">
                          <line
                            x1="0" y1="0"
                            x2="0" y2={connectorHeight}
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4 3"
                          />
                          <line
                            x1="0" y1={connectorHeight}
                            x2="40" y2={connectorHeight}
                            stroke="currentColor"
                            strokeWidth="1"
                            strokeDasharray="4 3"
                          />
                        </svg>
                      </div>
                    )}
                    <AnimatePresence>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: matchIndex * 0.05 + roundIndex * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        onClick={() => onMatchClick?.(match)}
                        className={`w-full text-left rounded-xl overflow-hidden border transition-all duration-300 ${
                          match.status === "LIVE"
                            ? "border-red-500/40 shadow-lg shadow-red-500/10"
                            : match.status === "COMPLETED"
                              ? "border-accent/25 shadow-lg shadow-accent/5"
                              : match.status === "READY"
                                ? "border-cyan-500/20 hover:border-cyan-500/40"
                                : "border-border hover:border-border-strong"
                        } ${match.status !== "PENDING" ? "bg-surface" : "bg-surface-2"}`}
                        style={{ width: matchWidth, height: matchHeight }}
                      >
                        <div className="flex flex-col h-full p-2.5 gap-1">
                          <div className={`flex items-center gap-2 text-[12px] ${
                            match.winner?.id === match.player1?.id ? "text-ink font-semibold" : "text-muted-soft"
                          }`}>
                            <div className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[9px] font-bold text-muted-faint shrink-0">
                              {match.player1?.seed ?? "?"}
                            </div>
                            <span className="truncate">{match.player1?.name ?? "TBD"}</span>
                            {match.score1 !== null && (
                              <span className="ml-auto font-bold tabular-nums text-[13px]">{match.score1}</span>
                            )}
                          </div>
                          <div className="h-px bg-border-faint" />
                          <div className={`flex items-center gap-2 text-[12px] ${
                            match.winner?.id === match.player2?.id ? "text-ink font-semibold" : "text-muted-soft"
                          }`}>
                            <div className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[9px] font-bold text-muted-faint shrink-0">
                              {match.player2?.seed ?? "?"}
                            </div>
                            <span className="truncate">{match.player2?.name ?? "TBD"}</span>
                            {match.score2 !== null && (
                              <span className="ml-auto font-bold tabular-nums text-[13px]">{match.score2}</span>
                            )}
                          </div>
                          {match.status === "LIVE" && (
                            <span className="absolute top-1 right-1.5 live-badge text-[8px] px-1.5 py-0.5">LIVE</span>
                          )}
                        </div>
                      </motion.button>
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          );
        })}
        {showFinals && (
          <div className="flex flex-col justify-center min-w-[160px]">
            <div className="sticky top-0 z-10 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold whitespace-nowrap px-2">Champion</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
              </div>
            </div>
            <div className="glass-gold p-6 text-center rounded-2xl border-2 border-gold/20 animate-pulse-gold">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-gold">Winner</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileBracketView({
  bracket,
  onMatchClick,
}: {
  bracket: BracketData;
  onMatchClick?: (match: BracketMatchUI) => void;
}) {
  const [expandedRound, setExpandedRound] = useState<number>(0);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2 bc-no-scrollbar">
        {bracket.rounds.map((_, i) => (
          <button
            key={i}
            onClick={() => setExpandedRound(i)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
              expandedRound === i
                ? "bg-accent text-bg"
                : "bg-surface-2 text-muted-soft border border-border"
            }`}
          >
            {bracket.totalRounds - i === 1 ? "Final" :
             bracket.totalRounds - i === 2 ? "Semi" :
             bracket.totalRounds - i === 3 ? "QF" :
             bracket.totalRounds - i === 4 ? "R16" :
             `R${i + 1}`}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={expandedRound}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-2"
        >
          {bracket.rounds[expandedRound]?.map((match) => (
            <motion.button
              key={match.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onMatchClick?.(match)}
              className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                match.status === "LIVE"
                  ? "border-red-500/30 bg-red-500/5"
                  : match.status === "COMPLETED"
                    ? "border-accent/20 bg-accent/5"
                    : "border-border bg-surface"
              }`}
            >
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-faint w-4">{match.player1?.seed ?? "?"}</span>
                    <span className={`text-[13px] ${match.winner?.id === match.player1?.id ? "text-ink font-semibold" : "text-muted-soft"}`}>
                      {match.player1?.name ?? "TBD"}
                    </span>
                  </div>
                  {match.score1 !== null && (
                    <span className={`text-[15px] font-bold tabular-nums ${match.winner?.id === match.player1?.id ? "text-accent" : "text-muted-soft"}`}>
                      {match.score1}
                    </span>
                  )}
                </div>
                <div className="h-px bg-border-faint" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-faint w-4">{match.player2?.seed ?? "?"}</span>
                    <span className={`text-[13px] ${match.winner?.id === match.player2?.id ? "text-ink font-semibold" : "text-muted-soft"}`}>
                      {match.player2?.name ?? "TBD"}
                    </span>
                  </div>
                  {match.score2 !== null && (
                    <span className={`text-[15px] font-bold tabular-nums ${match.winner?.id === match.player2?.id ? "text-accent" : "text-muted-soft"}`}>
                      {match.score2}
                    </span>
                  )}
                </div>
                {match.status === "LIVE" && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-bold tracking-wider uppercase text-red-400">Live</span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function BracketPreview({
  playerCount,
  type = "KNOCKOUT",
  className = "",
}: {
  playerCount: number;
  type: string;
  className?: string;
}) {
  const previewData = useMemo(() => {
    const totalRounds = Math.ceil(Math.log2(playerCount));
    const bracketSize = Math.pow(2, totalRounds);
    const rounds: BracketMatchUI[][] = [];

    for (let r = 0; r < totalRounds; r++) {
      const matchCount = bracketSize / Math.pow(2, r + 1);
      const round: BracketMatchUI[] = [];
      for (let m = 0; m < matchCount; m++) {
        round.push({
          id: `preview-r${r}-${m}`,
          round: r + 1,
          position: m,
          player1: null,
          player2: null,
          winner: null,
          score1: null,
          score2: null,
          status: "PENDING",
        });
      }
      rounds.push(round);
    }
    return { rounds, totalRounds, title: "Preview" };
  }, [playerCount]);

  if (type === "ROUND_ROBIN") {
    const matchCount = (playerCount * (playerCount - 1)) / 2;
    return (
      <div className={`glass-v2 p-6 text-center ${className}`}>
        <p className="text-[13px] text-muted-soft mb-2">Round Robin</p>
        <p className="text-2xl font-bold text-gradient-accent">{matchCount}</p>
        <p className="text-[11px] text-muted-faint mt-1">Total Matches</p>
      </div>
    );
  }

  return <AnimatedBracket bracket={previewData} className={className} />;
}
