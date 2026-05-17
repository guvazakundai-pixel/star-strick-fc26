"use client";

import { motion } from "framer-motion";

type Rarity = "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

type AchievementBadgeProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  rarity: Rarity;
  unlocked: boolean;
  progress?: { current: number; max: number };
  className?: string;
};

const RARITY_META: Record<Rarity, { label: string; color: string; border: string; glow: string; bg: string }> = {
  COMMON: {
    label: "Common",
    color: "text-muted-soft",
    border: "rgba(255,255,255,0.06)",
    glow: "transparent",
    bg: "rgba(255,255,255,0.02)",
  },
  RARE: {
    label: "Rare",
    color: "text-cyan",
    border: "rgba(34,211,238,0.20)",
    glow: "rgba(34,211,238,0.10)",
    bg: "rgba(34,211,238,0.04)",
  },
  EPIC: {
    label: "Epic",
    color: "text-purple",
    border: "rgba(168,85,247,0.20)",
    glow: "rgba(168,85,247,0.15)",
    bg: "rgba(168,85,247,0.04)",
  },
  LEGENDARY: {
    label: "Legendary",
    color: "text-gold",
    border: "rgba(255,184,0,0.25)",
    glow: "rgba(255,184,0,0.20)",
    bg: "rgba(255,184,0,0.05)",
  },
};

export function AchievementBadge({
  title,
  description,
  icon,
  rarity,
  unlocked,
  progress,
  className = "",
}: AchievementBadgeProps) {
  const meta = RARITY_META[rarity];
  const progressPct = progress ? Math.min((progress.current / progress.max) * 100, 100) : 0;

  return (
    <motion.div
      initial={unlocked ? { opacity: 0, scale: 0.9, y: 12 } : { opacity: 0, y: 12 }}
      animate={unlocked ? { opacity: 1, scale: 1, y: 0 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-[18px] p-4 relative overflow-hidden ${className}`}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        boxShadow: unlocked && rarity !== "COMMON" ? `0 0 30px ${meta.glow}` : "none",
      }}
    >
      {unlocked && rarity !== "COMMON" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(300px 150px at 30% 20%, ${meta.glow}, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10 flex items-start gap-3">
        <div
          className="h-11 w-11 rounded-[12px] flex items-center justify-center text-lg shrink-0 transition-all duration-300"
          style={{
            background: unlocked
              ? `linear-gradient(135deg, ${meta.glow.replace("0.10", "0.15")}, ${meta.glow.replace("0.10", "0.05")})`
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${unlocked ? meta.border : "rgba(255,255,255,0.04)"}`,
            boxShadow: unlocked ? `0 0 20px ${meta.glow}` : "none",
          }}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-bold truncate ${unlocked ? "text-ink" : "text-ink-soft"}`}>
              {title}
            </h3>
            <span
              className={`text-[8px] font-black tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-[4px] ${meta.color}`}
              style={{
                background: meta.glow,
                border: `1px solid ${meta.border}`,
              }}
            >
              {meta.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-soft mt-0.5 leading-relaxed">{description}</p>

          {progress && !unlocked && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-muted-faint">
                  {progress.current} / {progress.max}
                </span>
                <span className="text-[9px] font-mono text-muted-faint">
                  {Math.round(progressPct)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)", boxShadow: "0 0 8px rgba(0,255,133,0.3)" }}
                />
              </div>
            </div>
          )}

          {unlocked && (
            <div className="flex items-center gap-1.5 mt-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-wider text-accent">Unlocked</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
