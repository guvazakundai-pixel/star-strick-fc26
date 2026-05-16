"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthModal } from "@/lib/auth-context";
import { useSession } from "@/lib/session-client";
import { ChallengeModal } from "@/components/match/ChallengeModal";

type PlayerItem = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  platform: string | null;
};

type MatchItem = {
  id: string;
  score1: number;
  score2: number;
  status: string;
  isDisputed: boolean;
  createdAt: string;
  player1: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  player2: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  winner: { id: string; username: string; displayName: string | null } | null;
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function FindMatchPage() {
  const session = useSession();
  const { openAuth } = useAuthModal();
  const [activeTab, setActiveTab] = useState<"quick" | "challenge">("quick");
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeTarget, setChallengeTarget] = useState<{ id: string; name: string } | null>(null);
  const [recentMatches, setRecentMatches] = useState<MatchItem[]>([]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rankings?limit=50");
      const data = await res.json();
      setPlayers((data.players ?? data.rankings ?? []) as PlayerItem[]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches?limit=10");
      const data = await res.json();
      setRecentMatches(data.matches ?? []);
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
    fetchRecentMatches();
  }, [fetchPlayers, fetchRecentMatches]);

  const filtered = players.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.username.toLowerCase().includes(q) ||
      (p.displayName && p.displayName.toLowerCase().includes(q))
    );
  });

  const handleChallenge = (receiverId: string) => {
    if (!session) {
      openAuth("join");
      return;
    }
    const p = players.find((pl) => pl.id === receiverId);
    setChallengeTarget(p ? { id: p.id, name: p.displayName || p.username } : { id: receiverId, name: receiverId });
  };

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-8">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Competitive Play
          </p>
          <h1 className="bc-headline mt-1 text-3xl sm:text-5xl text-ink">
            Find a Match
          </h1>
          <p className="mt-1 text-sm text-muted">
            Challenge opponents, report results, climb the rankings
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActiveTab("quick")}
            className={`frosted-card p-6 space-y-4 text-left transition-all duration-200 hover:border-accent/18 ${
              activeTab === "quick" ? "!border-accent/25 !bg-accent/5" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-[14px] border border-accent/15 bg-accent/8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00ff85" strokeWidth={2} className="h-6 w-6">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <h2 className="bc-headline text-xl text-ink">Quick Match</h2>
            <p className="text-sm text-muted">
              Jump into a match with the next available opponent at your skill level.
            </p>
            {session ? (
              <span className="inline-flex items-center justify-center h-10 rounded-[14px] cta-primary px-4 text-sm font-bold tracking-wider">
                Find Opponent
              </span>
            ) : (
              <button
                onClick={() => openAuth("join")}
                className="inline-flex items-center justify-center h-10 rounded-[14px] cta-primary px-4 text-sm font-bold tracking-wider"
              >
                Sign Up to Play
              </button>
            )}
          </button>

          <button
            onClick={() => setActiveTab("challenge")}
            className={`frosted-card p-6 space-y-4 text-left transition-all duration-200 hover:border-gold/18 ${
              activeTab === "challenge" ? "!border-gold/25 !bg-gold/5" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-[14px] border border-gold/15 bg-gold/8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffb800" strokeWidth={2} className="h-6 w-6">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="bc-headline text-xl text-ink">Challenge a Player</h2>
            <p className="text-sm text-muted">
              Search for a specific opponent and send them a challenge request.
            </p>
            {session ? (
              <span className="inline-flex items-center justify-center h-10 rounded-[14px] border border-gold/25 bg-gold/8 px-4 text-sm font-bold tracking-wider text-gold">
                Challenge
              </span>
            ) : (
              <button
                onClick={() => openAuth("join")}
                className="inline-flex items-center justify-center h-10 rounded-[14px] cta-outline px-4 text-sm font-bold tracking-wider text-ink"
              >
                Sign Up to Challenge
              </button>
            )}
          </button>
        </div>

        {activeTab === "challenge" && (
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
                Challenge Player
              </p>
              <h2 className="bc-headline text-xl text-ink">Search Players</h2>
            </div>

            <div className="apple-input flex items-center gap-2 px-4 py-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-muted-soft shrink-0">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search by username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm text-ink placeholder:text-muted-faint outline-none"
              />
            </div>

            {loading ? (
              <p className="text-sm text-muted-soft py-8 text-center">Loading players...</p>
            ) : filtered.length === 0 ? (
              <div className="frosted-card p-8 text-center">
                <p className="text-sm text-muted">No players found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto bc-no-scrollbar">
                {filtered.map((player) => {
                  const isSelf = session && session.userId === player.id;
                  return (
                    <motion.div
                      key={player.id}
                      variants={fadeUp}
                      className="frosted-card-sm p-4 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-[12px] border border-border-faint bg-bg-elevated shrink-0 flex items-center justify-center bg-cover bg-center" style={player.avatarUrl ? { backgroundImage: `url(${player.avatarUrl})` } : undefined}>
                        {!player.avatarUrl && (
                          <span className="text-[10px] font-bold text-accent">
                            {(player.displayName || player.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink truncate">
                          {player.displayName || player.username}
                        </p>
                        <p className="font-mono text-[10px] text-muted-soft">
                          @{player.username} {player.platform && `· ${player.platform}`}
                        </p>
                      </div>
                      {isSelf ? (
                        <span className="font-mono text-[10px] text-muted-faint uppercase tracking-wider">You</span>
                      ) : (
                        <button
                          onClick={() => handleChallenge(player.id)}
                          className="rounded-[10px] border border-accent/20 bg-accent/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/15 transition-all duration-200"
                        >
                          Challenge
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>
        )}

        <section className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Recent Results
            </p>
            <h2 className="bc-headline text-xl text-ink">Latest Matches</h2>
          </div>

          {recentMatches.length === 0 ? (
            <div className="frosted-card p-8 text-center space-y-2">
              <p className="text-sm text-muted">No matches played yet</p>
              <p className="text-xs text-muted-soft">Be the first to compete!</p>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {recentMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </motion.div>
          )}
        </section>
      </div>
      <ChallengeModal
        open={!!challengeTarget}
        onClose={() => setChallengeTarget(null)}
        opponentId={challengeTarget?.id}
        opponentName={challengeTarget?.name}
      />
    </div>
  );
}

function MatchCard({ match }: { match: MatchItem }) {
  const statusColors: Record<string, string> = {
    PENDING: "text-gold",
    CONFIRMED: "text-cyan",
    APPROVED: "text-accent",
    DISPUTED: "text-negative",
  };

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/matches/${match.id}`}
        className="block frosted-card-sm p-4 hover:border-accent/15 transition-all duration-200 group"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink truncate group-hover:text-accent transition-colors duration-200">
                {match.player1.displayName || match.player1.username}
              </span>
              <span className="font-mono text-xs text-muted-soft tabular-nums">
                {match.score1}
              </span>
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-center">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${statusColors[match.status] ?? "text-muted-soft"}`}>
              {match.status}
            </span>
            <span className="text-[10px] text-muted-faint">vs</span>
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="font-mono text-xs text-muted-soft tabular-nums">
                {match.score2}
              </span>
              <span className="text-sm font-semibold text-ink truncate group-hover:text-accent transition-colors duration-200">
                {match.player2.displayName || match.player2.username}
              </span>
            </div>
          </div>
        </div>
        {(match.winner || match.isDisputed) && (
          <div className="mt-2 text-center">
            {match.winner && (
              <span className="font-mono text-[10px] text-accent">
                Winner: {match.winner.displayName || match.winner.username}
              </span>
            )}
            {match.isDisputed && (
              <span className="ml-2 font-mono text-[10px] text-negative">Disputed</span>
            )}
          </div>
        )}
        <div className="mt-1.5 text-center">
          <span className="font-mono text-[10px] text-muted-faint">
            {new Date(match.createdAt).toLocaleDateString()}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}