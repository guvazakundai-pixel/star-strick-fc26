"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cityTag } from "@/lib/players";
import type { Player } from "@/lib/players";
import { clubByPlayerId } from "@/lib/clubs";

interface Props {
  player: Player;
  index: number;
  onSelect: (id: string) => void;
}

export function SpotlightCard({ player, index, onSelect }: Props) {
  const club = useMemo(() => clubByPlayerId(player.id) ?? null, [player.id]);
  const stats = useMemo(() => {
    const total = player.wins + player.losses + player.draws;
    const winRate = total > 0 ? (player.wins / total) * 100 : 0;
    const gd = player.goalsFor - player.goalsAgainst;
    return { total, winRate, gd };
  }, [player]);

  const isTop3 = player.rank <= 3;
  const rankColor = player.rank === 1 ? "#ffb800" : player.rank === 2 ? "#E8E8F0" : player.rank === 3 ? "#CD7F32" : "var(--accent)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.08, 0.35), ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <button
        type="button"
        onClick={() => onSelect(player.id)}
        className="block w-full h-full text-left group"
      >
        <div
          className="relative h-full overflow-hidden rounded-[20px] sm:rounded-[24px] transition-all duration-200 hover:scale-[1.01] will-change-transform"
          style={{
            background: "linear-gradient(135deg, rgba(18,20,24,0.65) 0%, rgba(14,16,20,0.75) 100%)",
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            border: `1px solid ${isTop3 ? (player.rank === 1 ? "rgba(255,184,0,0.22)" : player.rank === 2 ? "rgba(200,200,210,0.18)" : "rgba(205,127,50,0.18)") : "rgba(255,255,255,0.06)"}`,
            boxShadow: isTop3
              ? player.rank === 1
                ? "0 0 60px -12px rgba(255,184,0,0.22), 0 12px 40px rgba(0,0,0,0.25)"
                : "0 0 40px -12px rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.25)"
              : "0 4px 24px rgba(0,0,0,0.18)",
          }}
        >
          {isTop3 && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: player.rank === 1
                  ? "radial-gradient(500px 250px at 15% 30%, rgba(255,184,0,0.08), transparent 65%)"
                  : player.rank === 2
                    ? "radial-gradient(500px 250px at 15% 30%, rgba(200,200,210,0.06), transparent 65%)"
                    : "radial-gradient(500px 250px at 15% 30%, rgba(205,127,50,0.06), transparent 65%)",
              }}
            />
          )}

          {/* Ghost watermark */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2 right-2 select-none leading-none"
            style={{
              fontFamily: "var(--font-barlow), system-ui, sans-serif",
              fontSize: "5rem",
              fontWeight: 900,
              fontStyle: "italic",
              letterSpacing: "-0.06em",
              color: isTop3
                ? player.rank === 1 ? "rgba(255,184,0,0.05)" : "rgba(255,255,255,0.03)"
                : "rgba(255,255,255,0.02)",
            }}
          >
            {player.gamertag.slice(0, 6).toUpperCase()}
          </span>

          <div className="relative z-10 p-4 sm:p-5">
            {/* Header: badges row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center rounded-[3px] px-1.5 h-[16px] text-[7px] font-black tracking-[0.14em] uppercase border bg-accent/5 border-accent/20 text-accent shrink-0">
                  {cityTag(player.city)}
                </span>
                <span className="inline-flex items-center rounded-[3px] px-1.5 h-[16px] text-[7px] font-black tracking-[0.14em] uppercase border bg-bg-highlight/60 border-border-strong text-muted-soft shrink-0">
                  CROSSPLAY
                </span>
                {club && (
                  <span className="inline-flex items-center rounded-[3px] px-1.5 h-[16px] text-[7px] font-bold uppercase tracking-wider shrink-0 bg-accent/5 border border-accent/15 text-accent/70 truncate max-w-[60px]">
                    {club.shortName}
                  </span>
                )}
              </div>
              <span
                className="cinematic-heading text-2xl sm:text-3xl leading-none tabular-nums shrink-0"
                style={{ color: rankColor }}
              >
                #{String(player.rank).padStart(2, "0")}
              </span>
            </div>

            {/* Identity */}
            <div className="flex items-end gap-3 mb-3">
              <div
                className="grid place-items-center h-[44px] w-[44px] sm:h-[52px] sm:w-[52px] rounded-full border-2 shrink-0"
                style={{
                  background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                  borderColor: isTop3 ? (player.rank === 1 ? "rgba(255,184,0,0.40)" : "rgba(255,255,255,0.20)") : "rgba(0,255,133,0.25)",
                  boxShadow: isTop3 && player.rank === 1 ? "0 0 30px -4px rgba(255,184,0,0.35)" : "0 0 20px -4px rgba(0,255,133,0.20)",
                }}
              >
                <span className="cinematic-heading text-lg sm:text-xl text-accent leading-none">
                  {player.gamertag.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 pb-0.5">
                <h3 className="cinematic-heading text-lg sm:text-xl text-ink leading-none truncate max-w-[160px] sm:max-w-[220px] group-hover:text-accent transition-colors duration-200">
                  {player.gamertag}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-muted-soft truncate max-w-[160px] sm:max-w-[220px] mt-0.5">
                  {player.name}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-px bg-border-faint rounded-[10px] overflow-hidden border border-border-faint mb-3">
              <SpotlightStat label="Wins" value={player.wins} accent />
              <SpotlightStat label="Draws" value={player.draws} />
              <SpotlightStat label="Losses" value={player.losses} negative />
              <SpotlightStat
                label="Win Rate"
                value={`${Math.round(stats.winRate)}%`}
                accent={stats.winRate >= 50}
              />
              <SpotlightStat
                label="Goal Diff"
                value={`${stats.gd >= 0 ? "+" : ""}${stats.gd}`}
                accent={stats.gd > 0}
                negative={stats.gd < 0}
              />
              <SpotlightStat
                label="Streak"
                value={player.winStreak > 0 ? `${player.winStreak}W` : "—"}
                accent={player.winStreak >= 3}
              />
            </div>

            {/* Points + Form row */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[7px] font-black tracking-[0.22em] uppercase text-muted-faint">Points</p>
                <p className="cinematic-heading text-xl sm:text-2xl text-ink tabular-nums leading-none mt-0.5 truncate">
                  {player.points.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {player.form.slice(0, 5).map((r, i) => (
                  <span
                    key={i}
                    className={`inline-grid place-items-center h-[18px] w-[18px] sm:h-[20px] sm:w-[20px] rounded-[4px] text-[7px] sm:text-[8px] font-black italic ${
                      r === "W"
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : r === "L"
                          ? "bg-negative/12 text-negative border border-negative/20"
                          : "bg-bg-highlight text-muted-soft border border-border-faint"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function SpotlightStat({
  label,
  value,
  accent = false,
  negative = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  negative?: boolean;
}) {
  const valCls = negative ? "text-negative" : accent ? "text-accent" : "text-ink";
  return (
    <div className="bg-bg/50 px-2 py-2 sm:px-3 sm:py-2.5 min-w-0">
      <p className="text-[6px] font-black tracking-[0.2em] uppercase text-muted-faint truncate">
        {label}
      </p>
      <p className={`bc-mono-score text-sm sm:text-base tabular-nums leading-none mt-0.5 truncate ${valCls}`}>
        {value}
      </p>
    </div>
  );
}
