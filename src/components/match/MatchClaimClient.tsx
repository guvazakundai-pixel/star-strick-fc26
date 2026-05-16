"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthModal } from "@/lib/auth-context";

interface ChallengerData {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  stats: {
    rating: number;
    wins: number;
    losses: number;
    winStreak: number;
    matchesPlayed: number;
    winRate: number;
  } | null;
  rank: number | null;
}

type PageState = "loading" | "invalid" | "ready" | "accepting" | "accepted" | "error";

export function MatchClaimClient() {
  const params = useParams();
  const router = useRouter();
  const { openAuth } = useAuthModal();
  const token = params?.token as string;

  const [pageState, setPageState] = useState<PageState>("loading");
  const [challenger, setChallenger] = useState<ChallengerData | null>(null);
  const [matchType, setMatchType] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const [wager, setWager] = useState<number>(0);
  const [error, setError] = useState("");

  const fetchChallenge = useCallback(async () => {
    if (!token) return;
    setPageState("loading");
    try {
      const res = await fetch(`/api/matches/claim/${token}`);
      if (res.status === 410) {
        setPageState("invalid");
        setError("This challenge link has expired or has already been used.");
        return;
      }
      if (!res.ok) {
        setPageState("invalid");
        setError("Challenge not found.");
        return;
      }
      const data = await res.json();
      setChallenger(data.challenger);
      setMatchType(data.matchType);
      setPlatform(data.platform);
      setWager(data.wagerAmount);
      setPageState("ready");
    } catch {
      setPageState("invalid");
      setError("Failed to load challenge. Check your connection.");
    }
  }, [token]);

  useEffect(() => { fetchChallenge(); }, [fetchChallenge]);

  const handleAccept = useCallback(async () => {
    const me = await fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!me?.user) {
      openAuth("signin");
      return;
    }

    setPageState("accepting");
    try {
      const res = await fetch(`/api/matches/claim/${token}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to accept" }));
        setError(err.error);
        setPageState("ready");
        return;
      }
      const data = await res.json();
      setPageState("accepted");
      setTimeout(() => router.push(`/matches/${data.matchId}`), 2000);
    } catch {
      setError("Something went wrong. Try again.");
      setPageState("ready");
    }
  }, [token, router, openAuth]);

  const matchTypeLabel = useMemo(() => {
    const labels: Record<string, string> = {
      RANKED: "Ranked Match",
      FRIEND_CHALLENGE: "Friend Challenge",
      QUICK_XP: "Quick XP Match",
      CLUB_BATTLE: "Club Battle",
    };
    return labels[matchType] ?? matchType;
  }, [matchType]);

  if (pageState === "loading") {
    return (
      <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin mx-auto" />
          <p className="mt-4 text-muted-soft text-sm">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">⚔️</span>
          <h1 className="cinematic-heading text-3xl text-ink mb-2">Challenge Expired</h1>
          <p className="text-muted-soft text-sm mb-6">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/matches")}
            className="btn-primary inline-flex items-center justify-center h-12 px-8 font-bold text-sm tracking-wide"
          >
            Find a Match
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "accepted") {
    return (
      <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.span
            className="text-6xl block mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            🎮
          </motion.span>
          <h1 className="cinematic-heading text-4xl text-accent mb-2">Battle Accepted!</h1>
          <p className="text-muted-soft text-sm">Redirecting to match room...</p>
          <div className="mt-6 h-1.5 w-48 rounded-full bg-bg-highlight mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-lg px-4 pt-12 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key="claim"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="text-center mb-8">
              <motion.span
                className="text-5xl block mb-3"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ⚡
              </motion.span>
              <p className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-faint mb-2">Incoming Challenge</p>
              <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink leading-[0.88]">
                You&apos;ve Been<br />
                <span className="text-gradient-accent">Challenged</span>
              </h1>
            </div>

            {challenger && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="frosted-card rounded-[24px] p-6 sm:p-8 border border-border-faint mb-6"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="grid place-items-center h-16 w-16 rounded-full border-2 shrink-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                      borderColor: "rgba(0,255,133,0.30)",
                      boxShadow: "0 0 30px -4px rgba(0,255,133,0.25)",
                    }}
                  >
                    <span className="cinematic-heading text-2xl text-accent leading-none">
                      {(challenger.displayName ?? challenger.username).charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="cinematic-heading text-2xl text-ink leading-none truncate max-w-[200px]">
                      {challenger.displayName ?? challenger.username}
                    </h2>
                    <p className="text-sm text-muted-soft truncate max-w-[200px]">
                      @{challenger.username}
                    </p>
                  </div>
                  {challenger.rank && (
                    <div className="ml-auto shrink-0 text-right">
                      <p className="cinematic-heading text-3xl text-accent tabular-nums leading-none">
                        #{challenger.rank}
                      </p>
                      <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint">Rank</p>
                    </div>
                  )}
                </div>

                {challenger.stats && (
                  <div className="grid grid-cols-3 gap-px bg-border-faint rounded-[12px] overflow-hidden border border-border-faint mb-5">
                    <div className="bg-bg/50 px-3 py-2.5">
                      <p className="text-[7px] font-black tracking-[0.2em] uppercase text-muted-faint">SR</p>
                      <p className="bc-mono-score text-sm text-accent tabular-nums mt-0.5">{challenger.stats.rating}</p>
                    </div>
                    <div className="bg-bg/50 px-3 py-2.5">
                      <p className="text-[7px] font-black tracking-[0.2em] uppercase text-muted-faint">W/R</p>
                      <p className="bc-mono-score text-sm text-ink tabular-nums mt-0.5">{challenger.stats.winRate}%</p>
                    </div>
                    <div className="bg-bg/50 px-3 py-2.5">
                      <p className="text-[7px] font-black tracking-[0.2em] uppercase text-muted-faint">Streak</p>
                      <p className="bc-mono-score text-sm text-accent tabular-nums mt-0.5">
                        {challenger.stats.winStreak > 0 ? `🔥${challenger.stats.winStreak}` : "—"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="inline-flex items-center rounded-[4px] px-2 h-[22px] text-[9px] font-black tracking-[0.14em] uppercase border bg-accent/5 border-accent/20 text-accent">
                    {matchTypeLabel}
                  </span>
                  <span className="inline-flex items-center rounded-[4px] px-2 h-[22px] text-[9px] font-black tracking-[0.14em] uppercase border bg-bg-highlight/60 border-border-strong text-muted-soft">
                    {platform}
                  </span>
                  {challenger.city && (
                    <span className="inline-flex items-center rounded-[4px] px-2 h-[22px] text-[9px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent/70">
                      {challenger.city}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-faint">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Challenge expires soon
                </div>
              </motion.div>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-negative text-sm text-center mb-4"
              >
                {error}
              </motion.p>
            )}

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAccept}
                disabled={pageState === "accepting"}
                className="w-full h-14 rounded-[18px] font-bold text-base tracking-[0.14em] uppercase transition-all duration-200 bg-accent text-bg border border-accent hover:bg-accent/90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ boxShadow: "0 0 40px rgba(0,255,133,0.25), 0 4px 20px rgba(0,0,0,0.3)" }}
              >
                {pageState === "accepting" ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-bg/30 border-t-bg animate-spin" />
                    Accepting...
                  </span>
                ) : (
                  "Accept Battle"
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full h-12 rounded-[16px] font-bold text-sm tracking-[0.14em] uppercase transition-all duration-200 bg-bg-elevated/60 text-muted-soft border border-border-faint hover:text-ink hover:border-border-strong"
              >
                Decline
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
