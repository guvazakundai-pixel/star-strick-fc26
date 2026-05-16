"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuthModal } from "@/lib/auth-context";

type TournamentDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string | null;
  prizePool: number;
  entryFee: number;
  creatorFee: number;
  platform: string | null;
  maxPlayers: number;
  description: string | null;
  startAt: string | null;
  createdAt: string;
  organizer: { id: string; username: string; displayName: string | null };
  participants: { id: string; userId: string; username: string; displayName: string | null; seed: number; status: string }[];
  bracket: { rounds: { id: string; round: number; position: number; player1Id: string | null; player2Id: string | null; winnerId: string | null; score1: number | null; score2: number | null; status: string }[][] } | null;
};

export function TournamentDetailClient({ tournamentId }: { tournamentId: string }) {
  const [data, setData] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [regState, setRegState] = useState<"idle" | "loading" | "registered" | "error">("idle");
  const { openAuth } = useAuthModal();

  const fetchTournament = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { fetchTournament(); }, [fetchTournament]);
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setLoggedIn(!!d?.user)).catch(() => {});
  }, []);

  const isOrganizer = data && false; // will be set from session
  const isRegistered = data?.participants.some((p) => p.status === "REGISTERED" || p.status === "ACTIVE");

  const handleRegister = useCallback(async () => {
    if (!loggedIn) { openAuth("signin"); return; }
    setRegState("loading");
    const res = await fetch(`/api/tournaments/${tournamentId}/register`, { method: "POST" });
    if (res.ok) {
      setRegState("registered");
      fetchTournament();
    } else {
      setRegState("error");
    }
  }, [tournamentId, loggedIn, openAuth, fetchTournament]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-28">
        <div className="h-12 w-64 rounded-[12px] bg-bg-elevated/30 animate-pulse mb-6" />
        <div className="h-40 rounded-[24px] bg-bg-elevated/30 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-28">
        <p className="text-2xl text-muted">Tournament not found</p>
        <Link href="/tournaments" className="mt-4 inline-block text-accent text-sm hover:underline">← Back to tournaments</Link>
      </div>
    );
  }

  const statusColor = data.status === "LIVE" ? "text-accent" : data.status === "REGISTRATION" ? "text-gold" : data.status === "COMPLETED" ? "text-muted-soft" : "text-muted-faint";
  const canRegister = data.status === "REGISTRATION" && !isRegistered && data.participants.length < data.maxPlayers;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-28">
      <Link href="/tournaments" className="inline-flex items-center gap-1 text-[10px] font-black tracking-[0.2em] uppercase text-muted-soft hover:text-ink transition-colors mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
        Tournaments
      </Link>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${statusColor}`}>{data.status}</span>
            <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">{data.type === "KNOCKOUT" ? "Single Elim" : "Round Robin"}</span>
            {data.city && <span className="text-[9px] font-bold tracking-wider text-accent/60 uppercase">{data.city}</span>}
          </div>
          <h1 className="cinematic-heading text-3xl sm:text-5xl text-ink leading-[0.88]">{data.name}</h1>
          <p className="text-sm text-muted-soft mt-1">Hosted by {data.organizer.displayName || data.organizer.username}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="cinematic-heading text-2xl sm:text-3xl text-ink tabular-nums leading-none">{data.participants.length}/{data.maxPlayers}</p>
          <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint">Players</p>
        </div>
      </div>

      {data.description && (
        <p className="text-sm text-ink-soft leading-relaxed mb-6 max-w-2xl">{data.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="inline-flex items-center rounded-[4px] px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent">
          🏆 ${(data.prizePool / 100).toFixed(2)} prize pool
        </span>
        {data.entryFee > 0 && (
          <span className="inline-flex items-center rounded-[4px] px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-bg-highlight/60 border border-border-strong text-muted-soft">
            ${(data.entryFee / 100).toFixed(2)} entry
          </span>
        )}
        {data.platform && (
          <span className="inline-flex items-center rounded-[4px] px-2 py-1 text-[9px] font-bold uppercase tracking-wider bg-bg-highlight/60 border border-border-strong text-muted-soft">
            {data.platform}
          </span>
        )}
      </div>

      {canRegister && (
        <button
          type="button"
          onClick={handleRegister}
          disabled={regState === "loading"}
          className="w-full h-12 rounded-[16px] font-bold text-sm tracking-[0.18em] uppercase bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-95 transition-all duration-200 mb-6 disabled:opacity-50"
        >
          {regState === "loading" ? "Registering..." : regState === "registered" ? "Registered ✓" : `Register — ${data.entryFee > 0 ? `$${(data.entryFee / 100).toFixed(2)}` : "Free"}`}
        </button>
      )}

      {/* Bracket */}
      {data.bracket && data.bracket.rounds.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[10px] font-black tracking-[0.28em] uppercase text-accent mb-4">Bracket</h2>
          <div className="overflow-x-auto bc-no-scrollbar">
            <div className="flex gap-4 min-w-max">
              {data.bracket.rounds.map((round, ri) => (
                <div key={ri} className="flex flex-col gap-3 min-w-[180px]">
                  <p className="text-[8px] font-black tracking-[0.22em] uppercase text-muted-faint text-center">
                    {ri === 0 ? "Round 1" : ri === data.bracket!.rounds.length - 1 ? "Final" : `Round ${ri + 1}`}
                  </p>
                  {round.map((match) => {
                    const p1 = data.participants.find((p) => p.userId === match.player1Id);
                    const p2 = data.participants.find((p) => p.userId === match.player2Id);
                    const winner = match.winnerId ? data.participants.find((p) => p.userId === match.winnerId) : null;
                    const isComplete = match.status === "COMPLETED";

                    return (
                      <div
                        key={match.id}
                        className={`rounded-[14px] border px-3 py-2.5 min-w-[160px] ${isComplete ? "border-accent/20 bg-accent/5" : "border-border-faint bg-bg-elevated/40"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[11px] font-bold truncate max-w-[100px] ${winner?.userId === match.player1Id ? "text-accent" : "text-ink"}`}>
                            {p1?.username ?? "—"}
                          </span>
                          {isComplete && <span className="text-[10px] font-mono tabular-nums text-ink">{match.score1}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <span className={`text-[11px] font-bold truncate max-w-[100px] ${winner?.userId === match.player2Id ? "text-accent" : match.player2Id ? "text-ink" : "text-muted-faint"}`}>
                            {p2?.username ?? "TBD"}
                          </span>
                          {isComplete && <span className="text-[10px] font-mono tabular-nums text-ink">{match.score2}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Participants */}
      <section>
        <h2 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-faint mb-3">Participants ({data.participants.length})</h2>
        <div className="space-y-1">
          {data.participants.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-[12px] bg-bg-elevated/30 border border-border-faint">
              <span className="text-[10px] font-mono tabular-nums text-muted-faint w-5">{i + 1}.</span>
              <span className="text-sm font-bold text-ink truncate">{p.displayName || p.username}</span>
              <span className="text-[9px] text-muted-soft lowercase">@{p.username}</span>
              {p.status === "ACTIVE" && <span className="ml-auto text-[8px] font-black tracking-wider uppercase text-accent">Active</span>}
              {p.status === "ELIMINATED" && <span className="ml-auto text-[8px] font-black tracking-wider uppercase text-negative/70">Eliminated</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
