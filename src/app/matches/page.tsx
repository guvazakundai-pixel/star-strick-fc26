"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchCenter } from "@/components/MatchCenter";
import { MatchHistoryClient } from "@/components/match/MatchHistoryClient";

export default function MatchesPage() {
  const [tab, setTab] = useState<"play" | "history">("play");

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
              <MatchCenter />
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
      </div>
    </div>
  );
}
