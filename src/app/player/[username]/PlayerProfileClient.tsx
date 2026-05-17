"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type ProfileData = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    country: string;
    platform: string | null;
    avatarUrl: string | null;
    fcUsername: string | null;
    createdAt: string;
  };
  ranking: {
    rankPosition: number;
    points: number;
    rankChange: number;
    finalScore: number;
  } | null;
  stats: {
    matchesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    goalsScored: number;
    goalsConceded: number;
    skillRating: number;
    points: number;
    winStreak: number;
    formHistory: string;
  } | null;
  club: {
    id: string;
    name: string;
    tag: string | null;
    slug: string | null;
    logoUrl: string | null;
  } | null;
  recentMatches: Array<{
    id: string;
    opponent: { username: string; displayName: string | null };
    myScore: number;
    oppScore: number;
    didWin: boolean;
    isDraw: boolean;
    date: string;
  }>;
};

const TABS = ["Overview", "Stats", "Matches", "Clubs"] as const;
type TabName = typeof TABS[number];

function getMedalTheme(rank: number) {
  if (rank === 1) return { label: "★ Champion", color: "#ffb800", bg: "rgba(255,184,0,0.08)", border: "rgba(255,184,0,0.20)", glow: "0 0 40px rgba(255,184,0,0.20)" };
  if (rank === 2) return { label: "#2 Runner-up", color: "#C8C8D2", bg: "rgba(200,200,210,0.06)", border: "rgba(200,200,210,0.16)", glow: "0 0 30px rgba(200,200,210,0.12)" };
  if (rank === 3) return { label: "#3 Bronze", color: "#CD7F32", bg: "rgba(205,127,50,0.06)", border: "rgba(205,127,50,0.16)", glow: "0 0 30px rgba(205,127,50,0.12)" };
  return null;
}

export default function PlayerProfileClient({ data }: { data: ProfileData }) {
  const [activeTab, setActiveTab] = useState<TabName>("Overview");
  const { user, ranking, stats, club, recentMatches } = data;
  const displayName = user.displayName || user.username;
  const matchesPlayed = stats?.matchesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
  const goalDiff = (stats?.goalsScored ?? 0) - (stats?.goalsConceded ?? 0);
  const formStr = stats?.formHistory ? stats.formHistory.slice(-5) : "";
  const formArr = formStr.split("") as ("W" | "L" | "D")[];
  const medal = ranking ? getMedalTheme(ranking.rankPosition) : null;

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-32 space-y-5">
        <ProfileHeader
          user={user}
          ranking={ranking}
          displayName={displayName}
          medal={medal}
          formArr={formArr}
        />

        <SwipeableTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          panels={{
            Overview: <OverviewPanel data={data} winRate={winRate} goalDiff={goalDiff} formArr={formArr} />,
            Stats: <StatsPanel data={data} winRate={winRate} goalDiff={goalDiff} />,
            Matches: <MatchesPanel matches={recentMatches} userId={user.id} />,
            Clubs: <ClubsPanel club={club} />,
          }}
        />
      </div>
    </div>
  );
}

function ProfileHeader({
  user,
  ranking,
  displayName,
  medal,
  formArr,
}: {
  user: ProfileData["user"];
  ranking: ProfileData["ranking"] | null;
  displayName: string;
  medal: ReturnType<typeof getMedalTheme>;
  formArr: ("W" | "L" | "D")[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="relative overflow-hidden rounded-[28px] inner-glow"
      style={{
        background: ranking && ranking.rankPosition <= 3
          ? "linear-gradient(135deg, rgba(18,20,24,0.60) 0%, rgba(14,16,18,0.55) 100%)"
          : "rgba(18,20,24,0.45)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: `1px solid ${medal?.border ?? "rgba(255,255,255,0.04)"}`,
        boxShadow: medal?.glow ?? "0 8px 32px rgba(0,0,0,0.20)",
      }}
    >
      {ranking && ranking.rankPosition <= 3 && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: ranking.rankPosition === 1
              ? "radial-gradient(400px 200px at 30% 50%, rgba(255,184,0,0.08), transparent 70%)"
              : ranking.rankPosition === 2
              ? "radial-gradient(400px 200px at 30% 50%, rgba(200,200,210,0.06), transparent 70%)"
              : "radial-gradient(400px 200px at 30% 50%, rgba(205,127,50,0.06), transparent 70%)",
          }}
        />
      )}

      <div className="relative z-10 p-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            <div
              className="h-20 w-20 rounded-[20px] border shrink-0 bg-cover bg-center flex items-center justify-center overflow-hidden"
              style={{
                borderColor: medal?.border ?? "rgba(255,255,255,0.06)",
                boxShadow: medal?.glow ?? "0 8px 28px rgba(0,0,0,0.25)",
                background: user.avatarUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                ...(user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}),
              }}
            >
              {!user.avatarUrl && (
                <span className="bc-headline text-3xl text-accent">{displayName[0].toUpperCase()}</span>
              )}
            </div>
            {ranking && ranking.rankPosition <= 3 && (
              <span
                className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{
                  background: ranking.rankPosition === 1 ? "#ffb800" : ranking.rankPosition === 2 ? "#C0C0C0" : "#CD7F32",
                  color: "#0D0D0F",
                  boxShadow: ranking.rankPosition === 1 ? "0 2px 8px rgba(255,184,0,0.40)" : "none",
                }}
              >
                {ranking.rankPosition}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="bc-headline text-3xl text-ink truncate">{displayName}</h1>
              {ranking && (
                <span className="shrink-0 pill-accent rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  #{ranking.rankPosition}
                </span>
              )}
              {medal && (
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: medal.bg, border: `1px solid ${medal.border}`, color: medal.color }}
                >
                  {medal.label}
                </span>
              )}
            </div>
            <p className="font-mono text-[11px] text-muted-soft mt-0.5">
              @{user.username}{user.platform && <span> · {user.platform}</span>}{user.country && <span> · {user.country}</span>}
            </p>
            {user.bio && (
              <p className="text-sm text-muted mt-1.5 line-clamp-2">{user.bio}</p>
            )}
            {ranking && ranking.rankChange !== 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`font-mono text-[11px] font-bold ${ranking.rankChange > 0 ? "text-accent" : "text-negative/80"}`}>
                  {ranking.rankChange > 0 ? "▲" : "▼"} {Math.abs(ranking.rankChange)} rank{Math.abs(ranking.rankChange) !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {formArr.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                {formArr.map((r, i) => (
                  <span
                    key={i}
                    className={
                      "inline-grid place-items-center h-6 w-6 rounded-[6px] text-[10px] font-bold " +
                      (r === "W" ? "bg-emerald/10 text-emerald border border-emerald/20" : r === "L" ? "bg-negative/10 text-negative border border-negative/16" : "bg-white/[0.03] text-ink-soft border border-white/[0.05]")
                    }
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SwipeableTabs({ tabs, activeTab, onTabChange, panels }: {
  tabs: readonly TabName[];
  activeTab: TabName;
  onTabChange: (t: TabName) => void;
  panels: Record<TabName, ReactNode>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = dragStartX - endX;
    const idx = tabs.indexOf(activeTab);
    if (Math.abs(diff) > 60) {
      if (diff > 0 && idx < tabs.length - 1) {
        onTabChange(tabs[idx + 1]);
      } else if (diff < 0 && idx > 0) {
        onTabChange(tabs[idx - 1]);
      }
    }
    setIsDragging(false);
  }, [isDragging, dragStartX, activeTab, tabs, onTabChange]);

  return (
    <div className="space-y-4">
      <div className="relative -mx-4 px-4 overflow-x-auto bc-no-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((t) => {
            const on = activeTab === t;
            return (
              <button
                key={t}
                onClick={() => onTabChange(t)}
                className={
                  "relative shrink-0 rounded-[12px] px-4 py-2 text-[12px] font-bold uppercase tracking-[0.16em] transition-all duration-300 " +
                  (on ? "text-accent" : "text-muted-soft hover:text-ink-soft")
                }
                style={{
                  background: on ? "rgba(0,255,133,0.06)" : "transparent",
                  border: on ? "1px solid rgba(0,255,133,0.14)" : "1px solid transparent",
                }}
              >
                {t}
                {on && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full"
                    style={{ background: "var(--accent)", boxShadow: "0 0 10px rgba(0,255,133,0.50)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {panels[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, variant, sub }: { label: string; value: string | number; accent?: boolean; variant?: "cyan" | "emerald" | "orange" | "purple" | "gold"; sub?: string }) {
  const v = variant || "";
  const glassClass = v === "cyan" ? "glass-cyan" : v === "emerald" ? "glass-emerald" : v === "orange" ? "glass-orange" : v === "purple" ? "glass-purple" : v === "gold" ? "glass-gold" : "frosted-card-sm";
  const gradientClass = v === "cyan" ? "text-gradient-cyan-blue" : v === "emerald" ? "text-gradient-lime-emerald" : v === "orange" ? "text-gradient-orange-gold" : "";
  return (
    <div className={`${glassClass} p-4 sm:p-5 rounded-[22px] transition-all duration-300 hover:scale-[1.02]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl sm:text-3xl mt-1 tabular-nums " + (accent ? "text-accent" : gradientClass || "text-ink")}>{value}</p>
      {sub && <p className="text-[10px] text-muted-faint font-mono mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value, accent, negative }: { label: string; value: string | number; accent?: boolean; negative?: boolean }) {
  return (
    <div className="frosted-card-sm p-3 rounded-[16px] text-center transition-all duration-300 hover:scale-[1.02]">
      <p className={"bc-headline text-lg tabular-nums " + (accent ? "text-accent" : negative ? "text-negative/80" : "text-ink")}>{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-faint mt-0.5">{label}</p>
    </div>
  );
}

function OverviewPanel({ data, winRate, goalDiff, formArr }: { data: ProfileData; winRate: number; goalDiff: number; formArr: ("W" | "L" | "D")[] }) {
  const { ranking, stats } = data;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Rank" value={ranking ? `#${ranking.rankPosition}` : "—"} accent={!!ranking} variant="cyan" />
        <StatCard label="Points" value={ranking?.points ?? stats?.points ?? 0} variant="emerald" />
        <StatCard label="Win Rate" value={`${winRate}%`} variant={winRate >= 60 ? "emerald" : winRate >= 40 ? "orange" : undefined} />
      </div>
      <div className="grid grid-cols-4 gap-2.5">
        <MiniStat label="Played" value={data.stats?.matchesPlayed ?? 0} />
        <MiniStat label="Wins" value={data.stats?.wins ?? 0} accent />
        <MiniStat label="Draws" value={data.stats?.draws ?? 0} />
        <MiniStat label="Losses" value={data.stats?.losses ?? 0} negative />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat label="Goals" value={data.stats?.goalsScored ?? 0} />
        <MiniStat label="GD" value={goalDiff >= 0 ? `+${goalDiff}` : `${goalDiff}`} accent={goalDiff > 0} negative={goalDiff < 0} />
        <MiniStat label="Skill" value={Math.round(data.stats?.skillRating ?? 1000)} />
      </div>
      {data.stats && data.stats.winStreak > 0 && (
        <div className="frosted-card-sm p-4 rounded-[20px] flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Win Streak</span>
          <span className="flex items-center gap-1.5 bc-headline text-xl text-accent">
            {data.stats.winStreak}
            <span className="text-[10px] text-muted-soft font-mono uppercase tracking-wider">🔥</span>
          </span>
        </div>
      )}
    </div>
  );
}

function StatsPanel({ data, winRate, goalDiff }: { data: ProfileData; winRate: number; goalDiff: number }) {
  const s = data.stats;
  const totalMatches = s?.matchesPlayed ?? 0;
  const wins = s?.wins ?? 0;
  const draws = s?.draws ?? 0;
  const losses = s?.losses ?? 0;

  const winPct = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const drawPct = totalMatches > 0 ? (draws / totalMatches) * 100 : 0;
  const lossPct = totalMatches > 0 ? (losses / totalMatches) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="glass-cyan p-5 rounded-[24px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-3">Win Rate Distribution</p>
        <div className="flex h-4 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          {winPct > 0 && <div className="bg-accent transition-all duration-700 rounded-l-full" style={{ width: `${winPct}%` }} />}
          {drawPct > 0 && <div className="bg-gold transition-all duration-700" style={{ width: `${drawPct}%` }} />}
          {lossPct > 0 && <div className="bg-negative/70 transition-all duration-700 rounded-r-full" style={{ width: `${lossPct}%` }} />}
        </div>
        <div className="flex items-center gap-4 mt-2.5 text-[10px] font-mono">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" /> <span className="text-accent">{wins}W</span></span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> <span className="text-gold">{draws}D</span></span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-negative/70" /> <span className="text-negative/80">{losses}L</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Goals Scored" value={s?.goalsScored ?? 0} variant="emerald" />
        <StatCard label="Goals Conceded" value={s?.goalsConceded ?? 0} variant="orange" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Goal Difference" value={goalDiff >= 0 ? `+${goalDiff}` : `${goalDiff}`} accent={goalDiff > 0} variant={goalDiff > 0 ? "emerald" : "orange"} />
        <StatCard label="Skill Rating" value={Math.round(s?.skillRating ?? 1000)} variant="cyan" />
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStat label="Points" value={data.ranking?.points ?? s?.points ?? 0} accent />
        <MiniStat label="Avg GF" value={totalMatches > 0 ? ((s?.goalsScored ?? 0) / totalMatches).toFixed(1) : "0"} />
        <MiniStat label="Avg GA" value={totalMatches > 0 ? ((s?.goalsConceded ?? 0) / totalMatches).toFixed(1) : "0"} negative />
      </div>
    </div>
  );
}

function MatchesPanel({ matches, userId }: { matches: ProfileData["recentMatches"]; userId: string }) {
  if (matches.length === 0) {
    return (
      <div className="glass p-8 text-center space-y-3">
        <p className="bc-headline text-xl text-ink">No matches yet</p>
        <p className="text-sm text-muted">Play your first match to see results here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {matches.map((m, i) => (
        <motion.div
          key={m.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <Link
            href={`/matches/${m.id}`}
            className="block frosted-card-sm p-3.5 rounded-[18px] hover:border-accent/16 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={
                    "shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-[10px] text-[11px] font-bold " +
                    (m.didWin ? "bg-emerald/10 text-emerald border border-emerald/20" : m.isDraw ? "bg-gold/10 text-gold border border-gold/16" : "bg-negative/10 text-negative border border-negative/16")
                  }
                >
                  {m.didWin ? "W" : m.isDraw ? "D" : "L"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">vs {m.opponent.displayName || m.opponent.username}</p>
                  <p className="font-mono text-[10px] text-muted-soft">@{m.opponent.username}</p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 font-mono text-sm tabular-nums">
                <span className={m.didWin ? "text-accent" : "text-ink"}>{m.myScore}</span>
                <span className="text-muted-faint">:</span>
                <span className={!m.didWin && !m.isDraw ? "text-accent" : "text-ink"}>{m.oppScore}</span>
              </div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function ClubsPanel({ club }: { club: ProfileData["club"] }) {
  if (!club) {
    return (
      <div className="glass p-8 text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="h-7 w-7 text-muted-soft">
            <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
          </svg>
        </div>
        <p className="bc-headline text-xl text-ink">Free Agent</p>
        <p className="text-sm text-muted">Not currently affiliated with any club.</p>
        <Link href="/clubs" className="inline-flex items-center justify-center h-11 rounded-[16px] cta-outline px-6 text-sm font-bold">
          Browse Clubs
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={`/club/${club.slug ?? club.tag ?? club.id}`}
      className="block group frosted-card p-5 rounded-[24px] hover:border-accent/20 transition-all duration-300"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-3">Club</p>
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-[16px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center"
          style={{
            backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            background: club.logoUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
          }}
        >
          {!club.logoUrl && (
            <span className="bc-headline text-2xl text-accent">{club.tag?.[0] ?? club.name[0]}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="bc-headline text-xl text-ink group-hover:text-accent transition-colors duration-300 truncate">{club.name}</p>
          <p className="font-mono text-[11px] text-muted-soft">[{club.tag}]</p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5 text-muted-soft group-hover:text-accent transition-colors duration-300 shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}