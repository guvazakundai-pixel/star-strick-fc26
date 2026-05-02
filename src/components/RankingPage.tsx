"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PLAYERS,
  CITIES,
  DIVISIONS,
  type Player,
  type Division,
  type City,
} from "@/lib/players";
import { CLUBS, clubByPlayerId, type Club } from "@/lib/clubs";
import { PlayerCard } from "./PlayerCard";

type SortKey = "rank" | "points" | "winRate" | "gd" | "streak";
type SortDir = "asc" | "desc";

const SORT_DEFAULT_DIR: Record<SortKey, SortDir> = {
  rank: "asc",
  points: "desc",
  winRate: "desc",
  gd: "desc",
  streak: "desc",
};

const SORT_LABELS: Record<SortKey, string> = {
  rank: "Rank",
  points: "Points",
  winRate: "Win Rate",
  gd: "GD",
  streak: "Streak",
};

/* ════════════════════════════════════════════════════════════════
 * Main page
 * ════════════════════════════════════════════════════════════════ */

export function RankingPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | "All">("All");
  const [division, setDivision] = useState<Division | "All">("All");
  const [clubId, setClubId] = useState<string | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [sheetOpen, setSheetOpen] = useState(false);

  const topMoverId = useMemo(() => {
    let bestId: string | null = null;
    let best = 0;
    for (const p of PLAYERS) {
      const delta = p.prev - p.rank;
      if (delta > best) {
        best = delta;
        bestId = p.id;
      }
    }
    return bestId;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLAYERS.filter((p) => {
      if (city !== "All" && p.city !== city) return false;
      if (division !== "All" && p.division !== division) return false;
      if (clubId !== "All") {
        const c = clubByPlayerId(p.id);
        if (!c || c.id !== clubId) return false;
      }
      if (!q) return true;
      const c = clubByPlayerId(p.id);
      return (
        p.name.toLowerCase().includes(q) ||
        p.gamertag.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (c?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [query, city, division, clubId]);

  const groupedByDivision = useMemo(() => {
    const groups: Record<Division, Player[]> = {
      Elite: [],
      Pro: [],
      Challenger: [],
      Rookie: [],
    };
    for (const p of filtered) groups[p.division].push(p);
    for (const d of DIVISIONS) {
      groups[d].sort((a, b) => compareBy(a, b, sortKey, sortDir));
    }
    return groups;
  }, [filtered, sortKey, sortDir]);

  const orderedIds = useMemo(
    () => DIVISIONS.flatMap((d) => groupedByDivision[d].map((p) => p.id)),
    [groupedByDivision],
  );

  const { activeId, setActiveId } = useActivePlayer(orderedIds);
  const activePlayer =
    PLAYERS.find((p) => p.id === activeId) ?? PLAYERS[0];
  const activeClub = clubByPlayerId(activePlayer.id) ?? null;

  useURLPlayerSync(activeId, setActiveId, orderedIds);
  useKeyboardNav({
    activeId,
    orderedIds,
    onOpenSheet: () => setSheetOpen(true),
    sheetOpen,
    onCloseSheet: () => setSheetOpen(false),
  });

  const headerHidden = useScrollDirection();

  const onRowSelect = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    if (isMobile) {
      setActiveId(id);
      setSheetOpen(true);
    } else {
      const el = document.querySelector(
        `[data-player-id="${id}"]`,
      ) as HTMLElement | null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [setActiveId]);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir(SORT_DEFAULT_DIR[k]);
    }
  };

  const totalShown = orderedIds.length;

  return (
    <div className="broadcast-theme min-h-screen">
      <BroadcastHeader hidden={headerHidden} />

      <FilterBar
        query={query}
        onQuery={setQuery}
        city={city}
        onCity={setCity}
        division={division}
        onDivision={setDivision}
        clubId={clubId}
        onClubId={setClubId}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        headerHidden={headerHidden}
        totalShown={totalShown}
        totalAll={PLAYERS.length}
      />

      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 pt-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-0 lg:gap-8">
          <RankingsList
            grouped={groupedByDivision}
            activeId={activeId}
            topMoverId={topMoverId}
            onSelect={onRowSelect}
            empty={totalShown === 0}
          />
          <DesktopDetailPanel player={activePlayer} club={activeClub} />
        </div>
      </div>

      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        player={activePlayer}
        club={activeClub}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * Header (disappearing) + JOIN RANKING CTA
 * ════════════════════════════════════════════════════════════════ */

function BroadcastHeader({ hidden }: { hidden: boolean }) {
  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-40 border-b border-[#1a1a1a] backdrop-blur-md " +
        "transition-transform duration-300 ease-out " +
        (hidden ? "-translate-y-full" : "translate-y-0")
      }
      style={{ background: "rgba(0, 0, 0, 0.65)" }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
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

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#9a9a9a]">
            <span>S1</span>
            <span className="h-3 w-px bg-[#333333]" />
            <span>Wk 12</span>
          </div>
          <button
            type="button"
            onClick={() => alert("Player onboarding launches with Phase 2 auth.")}
            className="bc-pulse-cta inline-flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-sm bg-[#00ff85] text-[#050505] bc-headline text-sm leading-none hover:bg-white transition-colors"
          >
            Join Ranking
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12h14" />
              <path d="M13 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════
 * Filter bar (sticky) — search + chips + sort
 * ════════════════════════════════════════════════════════════════ */

function FilterBar({
  query,
  onQuery,
  city,
  onCity,
  division,
  onDivision,
  clubId,
  onClubId,
  sortKey,
  sortDir,
  onSort,
  headerHidden,
  totalShown,
  totalAll,
}: {
  query: string;
  onQuery: (q: string) => void;
  city: City | "All";
  onCity: (c: City | "All") => void;
  division: Division | "All";
  onDivision: (d: Division | "All") => void;
  clubId: string;
  onClubId: (c: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  headerHidden: boolean;
  totalShown: number;
  totalAll: number;
}) {
  return (
    <div
      className="sticky z-30 backdrop-blur-md border-b border-[#1a1a1a] transition-[top] duration-300"
      style={{
        top: headerHidden ? 0 : 56,
        background: "rgba(5, 5, 5, 0.85)",
      }}
    >
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <label className="relative flex-1 min-w-0">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#9a9a9a]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </span>
            <input
              type="search"
              inputMode="search"
              placeholder="Search for a Pro, Gamertag, or Club..."
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              className="w-full h-10 rounded-sm bg-[#0a0a0a] ring-1 ring-[#1a1a1a] focus:ring-[#00ff85] focus:outline-none pl-10 pr-3 text-sm font-medium text-white placeholder:text-[#666] tracking-wide transition"
            />
          </label>
          <span className="hidden sm:inline-block text-[10px] font-black tracking-[0.2em] text-[#9a9a9a] px-2 tabular-nums">
            {totalShown}
            <span className="text-[#444]">/</span>
            {totalAll}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto bc-no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <FilterChip
            label="City"
            value={city}
            onChange={(v) => onCity(v as City | "All")}
            options={[
              { value: "All", label: "All" },
              ...CITIES.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterChip
            label="Division"
            value={division}
            onChange={(v) => onDivision(v as Division | "All")}
            options={[
              { value: "All", label: "All" },
              ...DIVISIONS.map((d) => ({ value: d, label: d })),
            ]}
          />
          <FilterChip
            label="Club"
            value={clubId}
            onChange={onClubId}
            options={[
              { value: "All", label: "All" },
              ...CLUBS.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
          {(city !== "All" || division !== "All" || clubId !== "All") && (
            <button
              type="button"
              onClick={() => {
                onCity("All");
                onDivision("All");
                onClubId("All");
              }}
              className="shrink-0 inline-flex items-center h-8 px-2.5 text-[10px] font-black tracking-[0.2em] text-[#ff4d4d] hover:text-white transition"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto bc-no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <span className="shrink-0 text-[10px] font-black tracking-[0.22em] text-[#666] uppercase">
            Sort
          </span>
          {(["rank", "points", "winRate", "gd", "streak"] as const).map((k) => {
            const active = sortKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onSort(k)}
                className={
                  "shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-sm text-[10px] font-black tracking-[0.18em] uppercase transition " +
                  (active
                    ? "bg-[#00ff85] text-[#050505]"
                    : "bg-[#0a0a0a] text-[#9a9a9a] ring-1 ring-[#1a1a1a] hover:text-white hover:ring-[#333]")
                }
              >
                {SORT_LABELS[k]}
                {active && (
                  <span className="text-[8px]">
                    {sortDir === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== "All";
  const current = options.find((o) => o.value === value)?.label ?? "All";
  return (
    <label
      className={
        "shrink-0 relative inline-flex items-center h-9 pl-3 pr-8 rounded-sm cursor-pointer " +
        "text-[11px] font-black tracking-[0.18em] uppercase transition " +
        (active
          ? "bg-[#0a0a0a] text-white ring-1 ring-[#00ff85]"
          : "bg-[#0a0a0a]/80 text-[#9a9a9a] ring-1 ring-[#1a1a1a] hover:text-white hover:ring-[#333]")
      }
    >
      <span className={active ? "text-[#00ff85] mr-1.5" : "mr-1.5"}>
        {label}
      </span>
      <span className="text-white/90 max-w-[100px] truncate">{current}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="absolute right-2 h-3 w-3 text-[#666] pointer-events-none"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}

/* ════════════════════════════════════════════════════════════════
 * List (master) — division-grouped with sticky tier banners
 * ════════════════════════════════════════════════════════════════ */

function RankingsList({
  grouped,
  activeId,
  topMoverId,
  onSelect,
  empty,
}: {
  grouped: Record<Division, Player[]>;
  activeId: string | null;
  topMoverId: string | null;
  onSelect: (id: string) => void;
  empty: boolean;
}) {
  let runningIndex = 0;

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
          Use ↑↓ to step through — Enter opens detail
        </p>
      </div>

      {empty ? (
        <div className="border border-dashed border-[#1a1a1a] rounded-sm p-12 text-center">
          <p className="bc-headline text-2xl text-white/60">No players match</p>
          <p className="mt-1 text-[11px] font-bold tracking-[0.18em] text-[#666] uppercase">
            Adjust filters or clear search
          </p>
        </div>
      ) : (
        DIVISIONS.map((d) => {
          const players = grouped[d];
          if (players.length === 0) return null;
          const sectionStart = runningIndex;
          runningIndex += players.length;
          return (
            <DivisionSection key={d} division={d} count={players.length}>
              <ul className="bc-list divide-y divide-[#1a1a1a] border-t border-b border-[#1a1a1a] bg-black/30">
                {players.map((p, i) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    club={clubByPlayerId(p.id) ?? null}
                    index={sectionStart + i}
                    active={p.id === activeId}
                    topMover={p.id === topMoverId}
                    onSelect={() => onSelect(p.id)}
                  />
                ))}
              </ul>
            </DivisionSection>
          );
        })
      )}
    </section>
  );
}

function DivisionSection({
  division,
  count,
  children,
}: {
  division: Division;
  count: number;
  children: ReactNode;
}) {
  const tier = tierStyle(division);
  return (
    <div className="mb-4">
      <div
        className="bc-tier-banner sticky z-20 flex items-center justify-between gap-3 px-2 sm:px-0 py-2"
        style={{ top: 178 }}
      >
        <div className="flex items-baseline gap-3 min-w-0">
          <h2
            className="bc-headline text-2xl sm:text-3xl leading-none truncate"
            style={{ color: tier.color }}
          >
            {division}
          </h2>
          <span className="text-[10px] font-black tracking-[0.22em] text-[#666] uppercase">
            {count} {count === 1 ? "Pro" : "Pros"}
          </span>
        </div>
        <span
          className="hidden sm:block text-[10px] font-black tracking-[0.22em] uppercase"
          style={{ color: tier.color, opacity: 0.7 }}
        >
          {tier.tag}
        </span>
      </div>
      <div className="h-[3px] w-full" style={{ background: tier.color }} />
      {children}
    </div>
  );
}

function tierStyle(d: Division): { color: string; tag: string } {
  switch (d) {
    case "Elite":
      return { color: "#FFB800", tag: "Top tier" };
    case "Pro":
      return { color: "#00ff85", tag: "Pro circuit" };
    case "Challenger":
      return { color: "#9a9a9a", tag: "Climbing" };
    case "Rookie":
      return { color: "#666666", tag: "Entry tier" };
  }
}

/* ════════════════════════════════════════════════════════════════
 * Detail content (shared between desktop panel + mobile sheet)
 * ════════════════════════════════════════════════════════════════ */

function DetailContent({
  player,
  club,
}: {
  player: Player;
  club: Club | null;
}) {
  const matches = player.wins + player.losses + player.draws;
  const winRate = matches > 0 ? (player.wins / matches) * 100 : 0;
  const goalDiff = player.goalsFor - player.goalsAgainst;
  const ghostSize = ghostFontSize(player.gamertag);

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
        className="bc-sweep absolute -bottom-6 right-0 select-none leading-none bc-headline pointer-events-none whitespace-nowrap"
        style={{
          fontSize: ghostSize,
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.08)",
          letterSpacing: "-0.06em",
        }}
      >
        {player.gamertag}
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
          <Metric
            label="Goal Diff"
            value={goalDiff > 0 ? `+${goalDiff}` : `${goalDiff}`}
            tone={goalDiff > 0 ? "positive" : goalDiff < 0 ? "negative" : "default"}
          />
          <Metric label="Matches" value={matches.toString()} />
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

        <div className="mt-6 pt-5 border-t border-[#1a1a1a] grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
              Prize Pool
            </p>
            <p className="mt-1 bc-headline text-2xl text-white tabular-nums">
              ${player.prizeMoney.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
              Rig
            </p>
            <p className="mt-1 text-[11px] text-white/80 leading-tight truncate">
              {player.hardware.console}
            </p>
            <p className="text-[10px] text-[#9a9a9a] truncate">
              {player.hardware.controller}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ghostFontSize(name: string): string {
  const len = name.length;
  if (len <= 4) return "240px";
  if (len <= 6) return "180px";
  if (len <= 8) return "140px";
  return "110px";
}

function Metric({
  label,
  value,
  icon,
  accent = false,
  tone = "default",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: boolean;
  tone?: "default" | "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-[#00ff85]"
      : tone === "negative"
        ? "text-[#ff4d4d]"
        : accent
          ? "text-[#00ff85]"
          : "text-white";
  return (
    <div className="bg-[#050505] px-4 py-4">
      <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] text-[#9a9a9a] uppercase">
        {icon}
        {label}
      </p>
      <p className={"mt-1 bc-headline text-3xl tabular-nums leading-none " + valueClass}>
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

/* ════════════════════════════════════════════════════════════════
 * Desktop sticky detail panel
 * ════════════════════════════════════════════════════════════════ */

function DesktopDetailPanel({
  player,
  club,
}: {
  player: Player;
  club: Club | null;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[200px]">
        <DetailContent player={player} club={club} />
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════════
 * Mobile bottom sheet
 * ════════════════════════════════════════════════════════════════ */

function MobileBottomSheet({
  open,
  onClose,
  player,
  club,
}: {
  open: boolean;
  onClose: () => void;
  player: Player;
  club: Club | null;
}) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragY(0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > 100) onClose();
    setDragY(0);
    startY.current = null;
  };

  return (
    <div
      aria-hidden={!open}
      className={
        "fixed inset-0 z-50 lg:hidden " +
        (open ? "pointer-events-auto" : "pointer-events-none")
      }
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={
          "absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 " +
          (open ? "opacity-100" : "opacity-0")
        }
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={
          "absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-xl " +
          "bg-[#050505] border-t border-[#1a1a1a] " +
          "transition-transform duration-300 ease-out"
        }
        style={{
          transform: open
            ? `translateY(${dragY}px)`
            : "translateY(100%)",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="sticky top-0 z-10 flex items-center justify-center pt-3 pb-2 bg-[#050505]">
          <span className="h-1 w-10 rounded-full bg-[#333]" />
        </div>
        <div className="px-3 pb-6">
          <DetailContent player={player} club={club} />
        </div>
      </aside>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * Hooks: active player tracking, URL sync, keyboard nav, scroll dir
 * ════════════════════════════════════════════════════════════════ */

function useActivePlayer(orderedIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(
    orderedIds[0] ?? null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let ticking = false;
    let cancelled = false;

    const compute = () => {
      ticking = false;
      if (cancelled) return;
      const center = window.innerHeight / 2;
      const rows = document.querySelectorAll<HTMLElement>("[data-player-id]");
      let bestId: string | null = null;
      let bestDist = Infinity;
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = row.dataset.playerId ?? null;
        }
      });
      if (bestId) {
        setActiveId((prev) => (prev === bestId ? prev : bestId));
      }
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(compute);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    requestAnimationFrame(compute);

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [orderedIds.length]);

  useEffect(() => {
    if (!orderedIds.length) {
      setActiveId(null);
      return;
    }
    if (!activeId || !orderedIds.includes(activeId)) {
      setActiveId(orderedIds[0]);
    }
  }, [orderedIds, activeId]);

  return { activeId, setActiveId };
}

function useURLPlayerSync(
  activeId: string | null,
  setActiveId: (id: string) => void,
  orderedIds: string[],
) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hydrated.current) return;
    hydrated.current = true;
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    if (p && orderedIds.includes(p)) setActiveId(p);
  }, [orderedIds, setActiveId]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated.current || !activeId) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("p") === activeId) return;
    url.searchParams.set("p", activeId);
    window.history.replaceState({}, "", url.toString());
  }, [activeId]);
}

function useKeyboardNav({
  activeId,
  orderedIds,
  onOpenSheet,
  sheetOpen,
  onCloseSheet,
}: {
  activeId: string | null;
  orderedIds: string[];
  onOpenSheet: () => void;
  sheetOpen: boolean;
  onCloseSheet: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (sheetOpen && e.key === "Escape") {
        onCloseSheet();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }
      if (!["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
      if (!activeId || orderedIds.length === 0) return;
      const idx = orderedIds.indexOf(activeId);
      if (idx < 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = orderedIds[Math.min(idx + 1, orderedIds.length - 1)];
        document
          .querySelector(`[data-player-id="${next}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = orderedIds[Math.max(idx - 1, 0)];
        document
          .querySelector(`[data-player-id="${prev}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (window.matchMedia("(max-width: 1023px)").matches) {
          onOpenSheet();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeId, orderedIds, onOpenSheet, sheetOpen, onCloseSheet]);
}

function useScrollDirection() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    let ticking = false;

    const compute = () => {
      ticking = false;
      const y = window.scrollY;
      const dy = y - lastY;
      if (y < 80) setHidden(false);
      else if (dy > 6) setHidden(true);
      else if (dy < -6) setHidden(false);
      lastY = y;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(compute);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return hidden;
}

/* ════════════════════════════════════════════════════════════════
 * Sort comparator
 * ════════════════════════════════════════════════════════════════ */

function compareBy(
  a: Player,
  b: Player,
  key: SortKey,
  dir: SortDir,
): number {
  const av = sortValue(a, key);
  const bv = sortValue(b, key);
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}

function sortValue(p: Player, key: SortKey): number {
  switch (key) {
    case "rank":
      return p.rank;
    case "points":
      return p.points;
    case "winRate": {
      const total = p.wins + p.losses + p.draws;
      return total > 0 ? p.wins / total : 0;
    }
    case "gd":
      return p.goalsFor - p.goalsAgainst;
    case "streak":
      return p.winStreak;
  }
}
