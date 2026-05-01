"use client";

import { forwardRef } from "react";
import type { Player } from "@/lib/players";
import type { Club } from "@/lib/clubs";

type Props = {
  player: Player;
  club: Club | null;
  index: number;
  active: boolean;
  onSelect: () => void;
};

export const PlayerCard = forwardRef<HTMLLIElement, Props>(function PlayerCard(
  { player, club, index, active, onSelect },
  ref,
) {
  const rankStr = player.rank.toString().padStart(2, "0");
  const delta = player.prev - player.rank;
  const initial = player.gamertag.charAt(0).toUpperCase();

  return (
    <li
      ref={ref}
      data-player-id={player.id}
      className={
        "bc-row bc-stagger-in group relative isolate cursor-pointer " +
        "border-l-4 transition-all duration-300 " +
        (active
          ? "border-[#00ff85] bg-gradient-to-r from-[#00ff85]/[0.07] via-transparent to-transparent"
          : "border-transparent hover:border-[#00ff85] hover:bg-gradient-to-r hover:from-[#00ff85]/[0.05] hover:via-transparent hover:to-transparent")
      }
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      onClick={onSelect}
    >
      <span
        aria-hidden
        className={
          "pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 " +
          "bc-headline select-none leading-none text-[120px] sm:text-[150px] " +
          "transition-opacity duration-300 " +
          (active ? "text-white opacity-[0.06]" : "text-white opacity-[0.04]")
        }
      >
        {rankStr}
      </span>

      <div className="relative z-10 flex items-center gap-4 px-5 py-5 sm:px-7 sm:py-6">
        <div
          className={
            "shrink-0 grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-full " +
            "bg-[#1a1a1a] font-black italic text-lg sm:text-xl " +
            "transition-all duration-300 " +
            (active
              ? "ring-2 ring-[#00ff85] shadow-[0_0_24px_-4px_rgba(0,255,133,0.65)] text-[#00ff85]"
              : "ring-1 ring-[#333333] text-white/80")
          }
        >
          {initial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className={
                "bc-headline truncate text-2xl sm:text-3xl leading-none " +
                (active ? "text-white" : "text-white/90")
              }
            >
              {player.gamertag}
            </span>
            {delta !== 0 && (
              <span
                className={
                  "shrink-0 inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums " +
                  (delta > 0 ? "text-[#00ff85]" : "text-[#ff4d4d]")
                }
              >
                <TriangleIcon up={delta > 0} />
                {Math.abs(delta)}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[11px] sm:text-xs font-medium uppercase tracking-[0.18em] text-[#9a9a9a]">
            {player.name}
            {club && (
              <>
                <span className="mx-2 text-[#333333]">•</span>
                {club.name}
              </>
            )}
          </p>
        </div>

        <div className="hidden sm:flex shrink-0 items-center gap-3">
          <Pill label="ZWE" />
          {club && <Pill label={club.shortName} accent />}
        </div>

        <div className="shrink-0 text-right tabular-nums">
          <p className="bc-headline text-2xl sm:text-3xl leading-none text-white">
            {player.points.toLocaleString()}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-[#9a9a9a]">
            Pts
          </p>
        </div>
      </div>

      <span
        aria-hidden
        className={
          "absolute right-0 top-0 h-full w-px " +
          (active ? "bg-gradient-to-b from-transparent via-[#00ff85]/40 to-transparent" : "bg-transparent")
        }
      />
    </li>
  );
});

function Pill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-sm " +
        "text-[10px] font-black tracking-[0.15em] " +
        (accent
          ? "bg-[#00ff85] text-[#050505]"
          : "bg-[#1a1a1a] text-white/80 ring-1 ring-[#333333]")
      }
    >
      {label}
    </span>
  );
}

function TriangleIcon({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 10 10"
      className={"h-2.5 w-2.5 " + (up ? "" : "rotate-180")}
      fill="currentColor"
      aria-hidden
    >
      <path d="M5 1 L9 8 L1 8 Z" />
    </svg>
  );
}
