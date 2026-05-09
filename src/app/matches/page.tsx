"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/session-client";

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

type MatchRequestItem = {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  sender: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
  receiver: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function MatchesPage() {
  const session = useSession();
  const [tab, setTab] = useState<"my" | "all">("my");
  const [myMatches, setMyMatches] = useState<MatchItem[]>([]);
  const [allMatches, setAllMatches] = useState<MatchItem[]>([]);
  const [matchRequests, setMatchRequests] = useState<MatchRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes] = await Promise.all([
        fetch("/api/matches?limit=20").then((r) => r.json()),
      ]);
      setAllMatches(allRes.matches ?? []);

      if (session) {
        const [myRes, reqRes] = await Promise.all([
          fetch(`/api/matches?player=${session.userId}&limit=20`).then((r) => r.json()),
          fetch("/api/match-requests?limit=10").then((r) => r.json()),
        ]);
        setMyMatches(myRes.matches ?? []);
        setMatchRequests(reqRes.requests ?? []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMatches = tab === "my" ? myMatches : allMatches;

  const pendingRequests = matchRequests.filter((r) => r.status === "PENDING" && r.receiver.id === session?.userId);
  const outgoingRequests = matchRequests.filter((r) => r.status === "PENDING" && r.sender.id === session?.userId);

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 space-y-6">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Match Center</p>
          <h1 className="bc-headline mt-1 text-3xl sm:text-5xl text-ink">Matches</h1>
          <p className="mt-1 text-sm text-muted">Track your matches, confirm results, manage challenges</p>
        </header>

        <div className="flex gap-2">
          <Link
            href="/matches/find"
            className="inline-flex items-center justify-center h-10 rounded-[14px] cta-primary px-5 text-sm font-bold tracking-wider"
          >
            Find Match
          </Link>
          <Link
            href="/matches/history"
            className="inline-flex items-center justify-center h-10 rounded-[14px] cta-outline px-5 text-sm font-bold tracking-wider"
          >
            All Results
          </Link>
        </div>

        {session && pendingRequests.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gold">Incoming Challenges</p>
              <h2 className="bc-headline text-xl text-ink">Pending Requests</h2>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {pendingRequests.map((req) => (
                <RequestCard key={req.id} request={req} direction="incoming" onRefresh={fetchData} />
              ))}
            </motion.div>
          </section>
        )}

        {session && outgoingRequests.length > 0 && (
          <section className="space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-soft">Outgoing Challenges</p>
            </div>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {outgoingRequests.map((req) => (
                <RequestCard key={req.id} request={req} direction="outgoing" onRefresh={fetchData} />
              ))}
            </motion.div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTab("my")}
              className={`rounded-[10px] px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                tab === "my"
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-soft hover:text-ink border border-transparent"
              } ${!session ? "pointer-events-none opacity-40" : ""}`}
            >
              My Matches
            </button>
            <button
              onClick={() => setTab("all")}
              className={`rounded-[10px] px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                tab === "all"
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "text-muted-soft hover:text-ink border border-transparent"
              }`}
            >
              All Recent
            </button>
          </div>

          {!session && tab === "my" ? (
            <div className="frosted-card p-8 text-center space-y-3">
              <p className="text-sm text-muted">Sign in to see your matches</p>
            </div>
          ) : loading ? (
            <p className="text-sm text-muted-soft py-4">Loading matches...</p>
          ) : activeMatches.length === 0 ? (
            <div className="frosted-card p-8 text-center space-y-3">
              <p className="text-sm text-muted">
                {tab === "my" ? "You haven't played any matches yet" : "No matches yet"}
              </p>
              <Link href="/matches/find" className="inline-flex items-center justify-center h-10 rounded-[14px] cta-primary px-4 text-sm font-bold tracking-wider">
                Find a Match
              </Link>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2">
              {activeMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </motion.div>
          )}
        </section>
      </div>
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

  const p1Name = match.player1.displayName || match.player1.username;
  const p2Name = match.player2.displayName || match.player2.username;
  const isP1Win = match.winner?.id === match.player1.id;
  const isP2Win = match.winner?.id === match.player2.id;

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/matches/${match.id}`}
        className="block frosted-card-sm p-4 hover:border-accent/15 transition-all duration-200 group"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 text-right">
            <p className={`text-sm font-semibold truncate ${isP1Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
              {p1Name}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5">
            <span className={`bc-headline text-lg tabular-nums ${isP1Win ? "text-accent" : "text-ink"}`}>
              {match.score1}
            </span>
            <span className="text-[10px] text-muted-faint font-mono">:</span>
            <span className={`bc-headline text-lg tabular-nums ${isP2Win ? "text-accent" : "text-ink"}`}>
              {match.score2}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold truncate ${isP2Win ? "text-accent" : "text-ink"} group-hover:text-accent transition-colors duration-200`}>
              {p2Name}
            </p>
          </div>
          <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider ${statusColors[match.status] ?? "text-muted-soft"}`}>
            {match.status}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function RequestCard({
  request,
  direction,
  onRefresh,
}: {
  request: MatchRequestItem;
  direction: "incoming" | "outgoing";
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const other = direction === "incoming" ? request.sender : request.receiver;
  const otherName = other.displayName || other.username;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await fetch(`/api/match-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      onRefresh();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    try {
      await fetch(`/api/match-requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      onRefresh();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await fetch(`/api/match-requests/${request.id}/cancel`, { method: "POST" });
      onRefresh();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={fadeUp}>
      <div className="frosted-card-sm p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-[12px] border border-border-faint bg-bg-elevated shrink-0 flex items-center justify-center bg-cover bg-center" style={other.avatarUrl ? { backgroundImage: `url(${other.avatarUrl})` } : undefined}>
          {!other.avatarUrl && (
            <span className="text-[10px] font-bold text-accent">{otherName[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{otherName}</p>
          <p className="font-mono text-[10px] text-muted-soft">
            @{other.username}
            {direction === "incoming" ? " challenges you" : " — pending"}
          </p>
          {request.message && (
            <p className="text-xs text-muted mt-0.5 line-clamp-1">&ldquo;{request.message}&rdquo;</p>
          )}
        </div>
        {direction === "incoming" ? (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={handleAccept}
              disabled={loading}
              className="rounded-[10px] bg-accent/10 border border-accent/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/15 transition-all duration-200 disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={loading}
              className="rounded-[10px] bg-surface border border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-negative transition-colors duration-200 disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        ) : (
          <button
            onClick={handleCancel}
            disabled={loading}
            className="shrink-0 rounded-[10px] border border-negative/20 bg-negative/8 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-negative/80 hover:text-negative transition-colors duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
}