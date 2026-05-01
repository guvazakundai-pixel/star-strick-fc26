"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLAYERS, type Player } from "@/lib/players";
import { clubByPlayerId, type Club } from "@/lib/clubs";
import { PlayerCard } from "./PlayerCard";

export function RankingPage() {
  const players = useMemo(
    () => [...PLAYERS].sort((a, b) => a.rank - b.rank),
    [],
  );
  const activeId = useActivePlayer(players);
  const activePlayer =
    players.find((p) => p.id === activeId) ?? players[0];
  const activeClub = clubByPlayerId(activePlayer.id) ?? null;

  return (
    <div className="broadcast-theme min-h-screen">
      <BroadcastHeader />

      <DetailMiniCard player={activePlayer} club={activeClub} />

      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-0 lg:gap-8">
          <RankingsList players={players} activeId={activeId} />
          <DetailPanel player={activePlayer} club={activeClub} />
        </div>
      </div>
    </div>
  );
}

/* ─── Header ────────────────────────────────────────────────── */

function BroadcastHeader() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-[#1a1a1a] backdrop-blur-md"
      style={{ background: "rgba(5, 5, 5, 0.65)" }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="bc-pulse-red h-2 w-2 rounded-full bg-[#ff3333]" />
            <span className="text-[10px] font-black tracking-[0.25em] text-[#ff3333]">
              LIVE
            </span>
          </div>
          <span className="h-5 w-px bg-[#333333]" />
          <span className="bc-headline truncate text-base sm:text-lg leading-none text-white">
            Star Strick
            <span className="text-[#00ff85]">·</span>
            <span className="text-white/60">FC26</span>
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a9a9a]">
          <span>Season 1</span>
          <span className="h-3 w-px bg-[#333333]" />
          <span>Week 12</span>
          <span className="h-3 w-px bg-[#333333]" />
          <span className="text-[#00ff85]">World Rankings</span>
        </div>
      </div>
    </header>
  );
}

/* ─── List (Master) ──────────────────────────────────────────── */

function RankingsList({
  players,
  activeId,
}: {
  players: Player[];
  activeId: string | null;
}) {
  const onSelect = (id: string) => {
    const el = document.querySelector(
      `[data-player-id="${id}"]`,
    ) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section aria-labelledby="rankings-heading" className="min-w-0">
      <div className="px-2 sm:px-0 mb-3 sm:mb-4 flex items-end justify-between">
        <h1
          id="rankings-heading"
          className="bc-headline text-3xl sm:text-5xl leading-[0.9] text-white"
        >
          World
          <br />
          <span className="text-[#00ff85]">Rankings</span>
        </h1>
        <p className="hidden sm:block max-w-[260px] text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a9a9a] text-right">
          Scroll to lock a player into the broadcast frame
        </p>
      </div>

      <ul className="bc-list divide-y divide-[#1a1a1a] border-t border-b border-[#1a1a1a] bg-[#0a0a0a]/40">
        {players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            club={clubByPlayerId(p.id) ?? null}
            index={i}
            active={p.id === activeId}
            onSelect={() => onSelect(p.id)}
          />
        ))}
      </ul>
    </section>
  );
}

/* ─── Detail (Sticky on desktop) ─────────────────────────────── */

function DetailPanel({
  player,
  club,
}: {
  player: Player;
  club: Club | null;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-20">
        <DetailContent player={player} club={club} />
      </div>
    </aside>
  );
}

function DetailContent({
  player,
  club,
}: {
  player: Player;
  club: Club | null;
}) {
  const matches = player.wins + player.losses + player.draws;
  const winRate = matches > 0 ? (player.wins / matches) * 100 : 0;

  return (
    <div
      key={player.id}
      className="bc-slide-fade relative overflow-hidden rounded-sm border border-[#1a1a1a] bg-[#0a0a0a]"
    >
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            "radial-gradient(600px 400px at 90% -10%, rgba(0,255,133,0.18), transparent 60%), radial-gradient(500px 400px at -10% 110%, rgba(255,255,255,0.04), transparent 55%)",
        }}
      />

      <span
        aria-hidden
        className="bc-sweep absolute -bottom-6 right-0 select-none leading-none text-[200px] xl:text-[260px] bc-headline pointer-events-none"
        style={{
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.08)",
          letterSpacing: "-0.06em",
        }}
      >
        {player.gamertag.slice(0, 4)}
      </span>

      <div className="relative z-10 p-6 xl:p-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.25em] text-[#00ff85]">
              ACTIVE
            </span>
            <span className="h-3 w-px bg-[#333333]" />
            <span className="text-[10px] font-bold tracking-[0.22em] text-[#9a9a9a] uppercase">
              {player.division}
            </span>
          </div>
          <span className="bc-headline text-5xl leading-none text-[#00ff85] tabular-nums">
            #{player.rank.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="mt-6 flex items-end gap-4">
          <div className="grid place-items-center h-24 w-24 rounded-full bg-[#1a1a1a] ring-2 ring-[#00ff85] shadow-[0_0_40px_-6px_rgba(0,255,133,0.55)]">
            <span className="bc-headline text-5xl text-[#00ff85] leading-none">
              {player.gamertag.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
              {player.city}
              <span className="mx-2 text-[#333333]">•</span>
              ZWE
            </p>
            <p className="mt-1 text-base font-bold text-white/90 truncate">
              {player.name}
            </p>
            {club && (
              <p className="text-[11px] font-bold tracking-[0.18em] text-[#9a9a9a] uppercase">
                {club.name}
              </p>
            )}
          </div>
        </div>

        <h2 className="bc-headline mt-6 leading-[0.85] text-white text-[44px] xl:text-[56px] break-words">
          {player.gamertag}
        </h2>

        <div className="mt-6 grid grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          <Metric
            label="Streak"
            value={player.winStreak.toString()}
            icon={<FireIcon />}
            accent={player.winStreak >= 5}
          />
          <Metric
            label="Win / Loss"
            value={`${player.wins} / ${player.losses}`}
          />
          <Metric label="Win Rate" value={`${winRate.toFixed(1)}%`} />
          <Metric label="G / Match" value={player.gpm.toFixed(2)} />
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase mb-2">
            Form
          </p>
          <div className="flex items-center gap-1.5">
            {player.form.map((r, i) => (
              <span
                key={i}
                className={
                  "inline-grid place-items-center h-8 w-8 text-xs font-black italic " +
                  (r === "W"
                    ? "bg-[#00ff85] text-[#050505]"
                    : r === "L"
                      ? "bg-[#ff3333] text-white"
                      : "bg-[#333333] text-white/80")
                }
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#1a1a1a] flex items-center justify-between">
          <span className="text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
            Prize Pool
          </span>
          <span className="bc-headline text-2xl text-white tabular-nums">
            ${player.prizeMoney.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#050505] px-4 py-4">
      <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
        {icon}
        {label}
      </p>
      <p
        className={
          "mt-1 bc-headline text-3xl tabular-nums leading-none " +
          (accent ? "text-[#00ff85]" : "text-white")
        }
      >
        {value}
      </p>
    </div>
  );
}

function FireIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5 text-[#ff7a00]"
      aria-hidden
    >
      <path d="M12 2c.5 4-2.5 5-2.5 8 0 1.66 1.12 3 2.5 3s2.5-1.34 2.5-3c0-1.5-1-2-1-3 2 .5 4.5 3.5 4.5 7 0 3.87-3.13 7-7 7s-7-3.13-7-7c0-4 4-6.5 4-9 0-1.5-.5-2.5-1-3 2 0 5 1 5 0Z" />
    </svg>
  );
}

/* ─── Mobile mini-card (top-docked) ──────────────────────────── */

function DetailMiniCard({
  player,
  club,
}: {
  player: Player;
  club: Club | null;
}) {
  return (
    <div className="lg:hidden sticky top-14 z-30 border-b border-[#1a1a1a] backdrop-blur-md"
      style={{ background: "rgba(5, 5, 5, 0.78)" }}
    >
      <div
        key={player.id}
        className="bc-slide-fade mx-auto max-w-[1400px] px-4 py-3 flex items-center gap-3"
      >
        <span className="bc-headline text-3xl leading-none text-[#00ff85] tabular-nums shrink-0">
          #{player.rank.toString().padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="bc-headline truncate text-xl leading-none text-white">
            {player.gamertag}
          </p>
          <p className="mt-1 truncate text-[10px] font-bold tracking-[0.18em] text-[#9a9a9a] uppercase">
            {club?.name ?? player.city}
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#1a1a1a] ring-1 ring-[#333333]">
          <FireIcon />
          <span className="bc-headline text-base leading-none text-white tabular-nums">
            {player.winStreak}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Active-player tracking via IntersectionObserver ────────── */

function useActivePlayer(players: Player[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(
    players[0]?.id ?? null,
  );
  const ratiosRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const list = document.querySelectorAll<HTMLElement>("[data-player-id]");
    if (list.length === 0) return;

    const ratios = ratiosRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.playerId;
          if (!id) continue;
          ratios.set(id, entry.intersectionRatio);
        }
        let bestId: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId && bestRatio > 0) setActiveId(bestId);
      },
      {
        rootMargin: "-40% 0px -40% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    list.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [players.length]);

  return activeId;
}
