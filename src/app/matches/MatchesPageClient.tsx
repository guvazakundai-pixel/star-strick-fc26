"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MatchCenter } from "@/components/MatchCenter";
import { MatchHistoryClient } from "@/components/match/MatchHistoryClient";
import { ChallengeModal } from "@/components/SimpleChallengeModal";

type MatchPlayer = { id: string; username: string; displayName: string | null };

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

interface Props {
  initialMatches: MatchItem[];
  initialStats: MatchStats | null;
  userId: string | null;
}

export function MatchesPageClient({ initialMatches, initialStats, userId }: Props) {
  const [tab, setTab] = useState<"play" | "history">("play");
  const [challengeOpen, setChallengeOpen] = useState(false);
  const router = useRouter();

  const handleOpenChallenge = useCallback(() => setChallengeOpen(true), []);
  const handleViewMatch = useCallback((id: string) => router.push(`/matches/${id}`), [router]);

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-28">
        <div className="flex gap-1.5 mb-6 bg-bg-elevated/40 rounded-[14px] p-1 border border-border-faint">
          <button
            onClick={() => setTab("play")}
            className={`flex-1 h-10 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${
              tab === "play"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted-soft hover:text-ink"
            }`}
          >
            Play
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 h-10 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all duration-200 ${
              tab === "history"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted-soft hover:text-ink"
            }`}
          >
            My Matches
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "play" && (
            <motion.div
              key="play"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <MatchCenter
                matches={initialMatches}
                stats={initialStats ?? undefined}
                onChallenge={handleOpenChallenge}
                onViewMatch={handleViewMatch}
              />
            </motion.div>
          )}
          {tab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-accent">Match History</p>
                <h1 className="mt-1 text-3xl sm:text-4xl text-ink">Your Battles</h1>
              </div>
              <MatchHistoryClient />
            </motion.div>
          )}
        </AnimatePresence>

        <ChallengeModal open={challengeOpen} onClose={() => setChallengeOpen(false)} />
      </div>
    </div>
  );
}
