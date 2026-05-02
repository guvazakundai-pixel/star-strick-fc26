"use client";

import { forwardRef } from "react";
import type { Player } from "@/lib/players";
import type { Club } from "@/lib/clubs";

type Props = {
  player: Player;
  club: Club | null;
  index: number;
  active: boolean;
  topMover: boolean;
  onSelect: () => void;
};

export const PlayerCard = forwardRef<HTMLLIElement, Props>(function PlayerCard(
  { player, club, index, active, topMover, onSelect },
  ref,
) {
  const rankStr = player.rank.toString().padStart(2, "0");
  const delta = player.prev - player.rank;
  const podium = podiumColor(player.rank);

  return (
    <li
      ref={ref}
      data-player-id={player.id}
      onClick={onSelect}
      className={
        "bc-row bc-stagger-in group relative isolate cursor-pointer " +
        "border-l-4 transition-all duration-300 will-change-transform " +
        (active
          ? "border-[#00ff85] bg-[#0a0a0a] bc-halo scale-[1.015]"
          : "border-transparent bg-transparent hover:border-[#00ff85]/50 hover:bg-[#0a0a0a]/60")
      }
      style={{
        animationDelay: `${Math.min(index, 12) * 38}ms`,
        transformOrigin: "left center",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -left-3 top-1/2 -translate-y-1/2 select-none leading-none bc-headline transition-all duration-300"
        style={{
          fontSize: "150px",
          color: podium ?? "#ffffff",
          opacity: active ? (podium ? 0.22 : 0.08) : podium ? 0.14 : 0.04,
          textShadow: podium ? `0 0 30px ${podium}40` : "none",
        }}
      >
        {rankStr}
      </span>

      <div className="relative z-10 flex items-center gap-3 sm:gap-4 px-4 sm:px-7 py-4 sm:py-5">
        <Avatar
          gamertag={player.gamertag}
          podium={podium}
          active={active}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
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
                <Triangle up={delta > 0} />
                {Math.abs(delta)}
              </span>
            )}
            {topMover && (
              <span className="shrink-0 inline-flex items-center text-[9px] font-black tracking-[0.2em] px-1.5 py-0.5 rounded-sm bg-[#00ff85]/15 text-[#00ff85] ring-1 ring-[#00ff85]/40">
                RISER
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a9a9a]">
            {player.name}
            {club && (
              <>
                <span className="mx-2 text-[#333]">•</span>
                {club.name}
              </>
            )}
          </p>
        </div>

        <div className="hidden sm:flex shrink-0 items-center gap-2.5">
          <Pill label="ZWE" />
          {club && <Pill label={club.shortName} accent />}
        </div>

        <div className="shrink-0 text-right tabular-nums">
          <p className="bc-headline text-xl sm:text-3xl leading-none text-white">
            {player.points.toLocaleString()}
          </p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#9a9a9a]">
            Pts
          </p>
        </div>
      </div>
    </li>
  );
});

function podiumColor(rank: number): string | null {
  if (rank === 1) return "#FFB800";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return null;
}

function Avatar({
  gamertag,
  podium,
  active,
}: {
  gamertag: string;
  podium: string | null;
  active: boolean;
}) {
  const seed = hashSeed(gamertag);
  const palettes = [
    ["#0f3a2a", "#001a10"],
    ["#3a1f1f", "#1a0808"],
    ["#1f1f3a", "#08081a"],
    ["#3a311f", "#1a1408"],
    ["#1f3a3a", "#081a1a"],
    ["#3a1f3a", "#1a081a"],
  ];
  const [a, b] = palettes[seed % palettes.length];
  const initials = gamertag.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  const ring = active ? "#00ff85" : podium ?? "#333333";

  return (
    <div
      className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-md overflow-hidden transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
        boxShadow: `inset 0 0 0 2px ${ring}${active ? "" : "80"}`,
      }}
    >
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full opacity-50"
        aria-hidden
      >
        <polygon
          points={`${(seed * 7) % 40},0 40,${(seed * 11) % 40} 40,40 0,40`}
          fill="rgba(255,255,255,0.06)"
        />
        <circle
          cx={(seed * 13) % 40}
          cy={(seed * 17) % 40}
          r="14"
          fill="rgba(255,255,255,0.04)"
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center bc-headline text-xl sm:text-2xl"
        style={{
          color: active ? "#00ff85" : podium ?? "#ffffff",
          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function Pill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center justify-center min-w-[40px] h-7 px-2 rounded-sm text-[10px] font-black tracking-[0.15em] " +
        (accent
          ? "bg-[#00ff85] text-[#050505]"
          : "bg-[#1a1a1a] text-white/80 ring-1 ring-[#333333]")
      }
    >
      {label}
    </span>
  );
}

function Triangle({ up }: { up: boolean }) {
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
