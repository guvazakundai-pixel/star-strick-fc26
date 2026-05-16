"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TournamentCreateForm } from "./TournamentCreateForm";

type TournamentSummary = {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string | null;
  prizePool: number;
  entryFee: number;
  creatorFee: number;
  maxPlayers: number;
  playerCount: number;
  startAt: string | null;
  createdAt: string;
  organizerName: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "text-muted-faint",
  REGISTRATION: "text-accent",
  LIVE: "text-gold",
  COMPLETED: "text-muted-soft",
};

export function TournamentListClient() {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments ?? []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const active = tournaments.filter((t) => t.status === "REGISTRATION" || t.status === "LIVE");
  const past = tournaments.filter((t) => t.status === "COMPLETED");
  const drafts = tournaments.filter((t) => t.status === "DRAFT");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="cinematic-heading text-4xl sm:text-6xl text-ink leading-[0.88]">
            <span className="text-gradient-accent">Tournaments</span>
          </h1>
          <p className="mt-2 text-sm text-muted-soft">Compete, climb, conquer — ZW tournament circuit.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="shrink-0 h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-95 transition-all duration-200"
        >
          + Create
        </button>
      </div>

      {showCreate && (
        <TournamentCreateForm
          onDone={() => { setShowCreate(false); fetchTournaments(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[20px] bg-bg-elevated/30 border border-border-faint animate-pulse" />
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="frosted-card p-12 text-center">
          <p className="text-4xl mb-3">🏆</p>
          <p className="bc-headline text-2xl text-muted">No tournaments yet</p>
          <p className="mt-1 text-[11px] font-bold tracking-[0.18em] text-muted-faint uppercase">
            Be the first to create one
          </p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[10px] font-black tracking-[0.28em] uppercase text-accent mb-3">Active & Upcoming</h2>
              <div className="space-y-2">
                {active.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-faint mb-3">Completed</h2>
              <div className="space-y-2">
                {past.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
          {drafts.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black tracking-[0.28em] uppercase text-muted-faint mb-3">Drafts</h2>
              <div className="space-y-2">
                {drafts.map((t) => <TournamentCard key={t.id} t={t} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TournamentCard({ t }: { t: TournamentSummary }) {
  const statusColor = STATUS_COLORS[t.status] ?? "text-muted-soft";
  const typeLabel = t.type === "KNOCKOUT" ? "Single Elim" : t.type === "ROUND_ROBIN" ? "Round Robin" : t.type;
  const slots = `${t.playerCount}/${t.maxPlayers}`;
  const cost = t.entryFee > 0 ? `$${(t.entryFee / 100).toFixed(2)}` : "Free";

  return (
    <Link
      href={`/tournaments/${t.id}`}
      className="block group"
    >
      <div className="relative overflow-hidden rounded-[20px] border border-border-faint bg-bg-elevated/40 hover:bg-bg-elevated/60 transition-all duration-200 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${statusColor}`}>
                {t.status}
              </span>
              <span className="text-[9px] font-bold tracking-wider text-muted-faint uppercase">
                {typeLabel}
              </span>
              {t.city && (
                <span className="text-[9px] font-bold tracking-wider text-accent/60 uppercase">
                  {t.city}
                </span>
              )}
            </div>
            <h3 className="cinematic-heading text-xl sm:text-2xl text-ink leading-none group-hover:text-accent transition-colors duration-200 truncate">
              {t.name}
            </h3>
            <p className="text-[10px] text-muted-soft mt-1">by {t.organizerName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="cinematic-heading text-lg text-ink tabular-nums leading-none">{slots}</p>
            <p className="text-[8px] font-black tracking-[0.2em] uppercase text-muted-faint mt-0.5">Players</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-accent/5 border border-accent/15 text-accent">
            🏆 ${(t.prizePool / 100).toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-bg-highlight/60 border border-border-strong text-muted-soft">
            {cost}
          </span>
          {t.startAt && (
            <span className="text-[8px] text-muted-faint">
              {new Date(t.startAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
