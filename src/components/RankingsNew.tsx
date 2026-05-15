"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { useAuthModal } from "@/lib/auth-context";

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

type TierTheme = {
  tier: string;
  rankColor: string;
  rankGlow: string;
  pointsColor: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  gradientLine: string;
  badgeBg: string;
  badgeBorder: string;
  cardBorder: string;
  cardShadow: string;
  spotlight: string;
  badgeText: string;
};

function getTierTheme(rank: number): TierTheme {
  if (rank === 1) return {
    tier: "champion",
    rankColor: "#ffb800",
    rankGlow: "rank-glow-gold",
    pointsColor: "#ffd75e",
    accent: "#ffb800",
    accentBg: "rgba(255,184,0,0.08)",
    accentBorder: "rgba(255,184,0,0.24)",
    gradientLine: "linear-gradient(180deg, #ffd75e, #ffb800)",
    badgeBg: "rgba(255,184,0,0.06)",
    badgeBorder: "rgba(255,184,0,0.18)",
    cardBorder: "rgba(255,184,0,0.20)",
    cardShadow: "0 16px 64px rgba(255,184,0,0.14), 0 0 100px -20px rgba(255,184,0,0.10), inset 0 1px 0 rgba(255,184,0,0.08)",
    spotlight: "radial-gradient(600px 250px at 25% 50%, rgba(255,184,0,0.10), transparent 65%)",
    badgeText: "★ GOAT",
  };
  if (rank === 2) return {
    tier: "runner",
    rankColor: "#E8E8F0",
    rankGlow: "rank-glow-silver",
    pointsColor: "#D6D6E0",
    accent: "#C8C8D2",
    accentBg: "rgba(200,200,210,0.06)",
    accentBorder: "rgba(200,200,210,0.20)",
    gradientLine: "linear-gradient(180deg, #E8E8F0, #C8C8D2)",
    badgeBg: "rgba(200,200,210,0.05)",
    badgeBorder: "rgba(200,200,210,0.16)",
    cardBorder: "rgba(200,200,210,0.18)",
    cardShadow: "0 12px 52px rgba(200,200,210,0.08), 0 0 80px -20px rgba(200,200,210,0.06), inset 0 1px 0 rgba(200,200,210,0.06)",
    spotlight: "radial-gradient(500px 200px at 25% 50%, rgba(200,200,210,0.06), transparent 60%)",
    badgeText: "★ Elite",
  };
  if (rank === 3) return {
    tier: "challenger",
    rankColor: "#E8A860",
    rankGlow: "rank-glow-bronze",
    pointsColor: "#E8A860",
    accent: "#CD7F32",
    accentBg: "rgba(205,127,50,0.06)",
    accentBorder: "rgba(205,127,50,0.18)",
    gradientLine: "linear-gradient(180deg, #E8A860, #CD7F32)",
    badgeBg: "rgba(205,127,50,0.05)",
    badgeBorder: "rgba(205,127,50,0.16)",
    cardBorder: "rgba(205,127,50,0.18)",
    cardShadow: "0 12px 52px rgba(205,127,50,0.08), 0 0 80px -20px rgba(205,127,50,0.06), inset 0 1px 0 rgba(205,127,50,0.06)",
    spotlight: "radial-gradient(500px 200px at 25% 50%, rgba(205,127,50,0.06), transparent 60%)",
    badgeText: "★ Top 3",
  };
  if (rank <= 10) return {
    tier: "elite",
    rankColor: "#00ff85",
    rankGlow: "",
    pointsColor: "#00ff85",
    accent: "#00ff85",
    accentBg: "rgba(0,255,133,0.06)",
    accentBorder: "rgba(0,255,133,0.18)",
    gradientLine: "linear-gradient(180deg, #00ff85, #00cc6a)",
    badgeBg: "rgba(0,255,133,0.05)",
    badgeBorder: "rgba(0,255,133,0.14)",
    cardBorder: "rgba(0,255,133,0.10)",
    cardShadow: "0 8px 40px rgba(0,0,0,0.22), 0 0 60px -16px rgba(0,255,133,0.06), inset 0 1px 0 rgba(0,255,133,0.04)",
    spotlight: "radial-gradient(400px 160px at 20% 50%, rgba(0,255,133,0.04), transparent 55%)",
    badgeText: `#${rank}`,
  };
  return {
    tier: "pro",
    rankColor: "#8E909A",
    rankGlow: "",
    pointsColor: "#22d3ee",
    accent: "#22d3ee",
    accentBg: "rgba(34,211,238,0.05)",
    accentBorder: "rgba(34,211,238,0.14)",
    gradientLine: "linear-gradient(180deg, #22d3ee, #3b82f6)",
    badgeBg: "rgba(255,255,255,0.03)",
    badgeBorder: "rgba(255,255,255,0.06)",
    cardBorder: "rgba(34,211,238,0.08)",
    cardShadow: "0 6px 32px rgba(0,0,0,0.18), 0 0 40px -12px rgba(34,211,238,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
    spotlight: "radial-gradient(350px 140px at 20% 50%, rgba(34,211,238,0.03), transparent 55%)",
    badgeText: `#${rank}`,
  };
}

function computeDerived(p: Player) {
  const matchesPlayed = p.wins + p.losses + p.draws;
  const winRate = matchesPlayed > 0 ? (p.wins / matchesPlayed) * 100 : 0;
  const goalDiff = p.goalsFor - p.goalsAgainst;
  const offensiveThreat = Math.min(100, Math.round(
    (p.gpm / 3.5) * 40 + (winRate / 100) * 30 + (p.winStreak > 0 ? Math.min(p.winStreak, 15) / 15 * 30 : 0)
  ));
  const defensiveIntegrity = Math.min(100, Math.round(
    (1 - p.goalsAgainst / Math.max(p.goalsFor, 1)) * 35 + ((matchesPlayed > 0 ? (1 - p.losses / matchesPlayed) : 0.5)) * 35 + (p.draws > 0 ? 30 : 20)
  ));
  const controlMetric = Math.min(100, Math.round(
    (winRate / 100) * 40 + ((p.goalsFor - p.goalsAgainst) / Math.max(p.goalsFor, 1)) * 25 + (p.draws / Math.max(matchesPlayed, 1)) * 15 + (matchesPlayed > 10 ? 20 : matchesPlayed * 2)
  ));
  return { matchesPlayed, winRate, goalDiff, offensiveThreat, defensiveIntegrity, controlMetric };
}

function generateAIReport(p: Player, stats: ReturnType<typeof computeDerived>) {
  const gamertag = p.gamertag;
  const lines: string[] = [];

  if (p.winStreak >= 5) {
    lines.push(`${gamertag} is absolutely relentless right now on a ${p.winStreak}-game win streak.`);
  } else if (p.winStreak >= 3) {
    lines.push(`${gamertag} has built solid momentum with a ${p.winStreak}-game win streak.`);
  } else if (p.winStreak === 0) {
    lines.push(`${gamertag}'s win streak was recently broken — expect a calculated comeback.`);
  }

  if (stats.offensiveThreat >= 80) {
    lines.push(`Their Offensive Threat rating of ${stats.offensiveThreat} is genuinely elite, making them one of the most dangerous attacking players on the Zimbabwean ladder.`);
  } else if (stats.offensiveThreat >= 60) {
    lines.push(`With an Offensive Threat of ${stats.offensiveThreat}, they consistently punish opponents who give them space.`);
  }

  if (stats.controlMetric >= 75) {
    lines.push(`A Control Metric of ${stats.controlMetric}% reveals midfield dominance — they dictate the tempo of nearly every match.`);
  } else if (stats.controlMetric >= 55) {
    lines.push(`Their Control Metric sits at ${stats.controlMetric}%, suggesting they can hold their own in most tactical battles.`);
  }

  if (stats.defensiveIntegrity >= 80) {
    lines.push(`Their Defensive Integrity (${stats.defensiveIntegrity}) is exceptional — breaking them down requires sustained, patient pressure.`);
  } else if (stats.defensiveIntegrity < 45) {
    lines.push(`Defensive gaps (${stats.defensiveIntegrity}) leave them vulnerable to high-pressure opponents — expect aggressive counter-attacking setups.`);
  }

  if (stats.winRate >= 80) {
    lines.push(`A ${Math.round(stats.winRate)}% win rate across ${stats.matchesPlayed} matches places them among the statistical elite.`);
  }

  if (p.form.includes("W") && p.form.includes("L")) {
    lines.push(`Recent inconsistency (form: ${p.form.join("-")}) shows they're beatable — but only by opponents who bring maximum focus.`);
  } else if (p.form.every(f => f === "W")) {
    lines.push(`Perfect recent form (${p.form.join("-")}) signals peak performance timing — they are the in-form player right now.`);
  }

  if (lines.length === 0) {
    lines.push(`${gamertag} is a disciplined competitor who has earned every point on this ladder. Their consistency is their weapon.`);
  }

  return lines.join(" ");
}

export function RankingsClient() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | "All">("All");
  const [division, setDivision] = useState<Division | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const { openAuth } = useAuthModal();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => setLoggedIn(!!d?.user)).catch(() => {});
  }, []);

  const sortedPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = PLAYERS.filter((p) => {
      if (city !== "All" && p.city !== city) return false;
      if (division !== "All" && p.division !== division) return false;
      if (q) {
        const club = clubByPlayerId(p.id);
        return (
          p.name.toLowerCase().includes(q) ||
          p.gamertag.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (club?.name.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const av = sortVal(a);
      const bv = sortVal(b);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, city, division, sortKey, sortDir]);

  const selectedPlayer = useMemo(
    () => PLAYERS.find((p) => p.id === selectedId) ?? null,
    [selectedId]
  );
  const selectedClub = useMemo(
    () => selectedPlayer ? clubByPlayerId(selectedPlayer.id) ?? null : null,
    [selectedPlayer]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  }, []);

  const [challengeState, setChallengeState] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({});

  const handleChallenge = useCallback(async (playerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!loggedIn) { openAuth("signin"); return; }
    setChallengeState(prev => ({ ...prev, [playerId]: "sending" }));
    try {
      const res = await fetch("/api/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: playerId, expiresInHours: 24 }),
      });
      if (!res.ok) throw new Error();
      setChallengeState(prev => ({ ...prev, [playerId]: "sent" }));
    } catch {
      setChallengeState(prev => ({ ...prev, [playerId]: "error" }));
    }
  }, [loggedIn, openAuth]);

  const handleSort = useCallback((k: SortKey) => {
    setSortKey((prev) => {
      if (prev === k) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(k);
        setSortDir(SORT_DEFAULT_DIR[k]);
      }
      return k;
    });
  }, []);

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <Header />
      <FilterBar
        query={query}
        onQuery={setQuery}
        city={city}
        onCity={setCity}
        division={division}
        onDivision={setDivision}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        totalShown={sortedPlayers.length}
        totalAll={PLAYERS.length}
      />
      <div className="mx-auto max-w-4xl px-3 sm:px-6 pt-4 pb-28">
        {sortedPlayers.length === 0 ? (
          <EmptyState />
        ) : (
          <RankingsList
            players={sortedPlayers}
            selectedId={selectedId}
            onSelect={handleSelect}
            swipedId={swipedId}
            onSwipe={setSwipedId}
            loggedIn={loggedIn}
            onChallenge={handleChallenge}
            challengeState={challengeState}
          />
        )}
      </div>
      <DetailSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        player={selectedPlayer}
        club={selectedClub}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(700px 300px at 50% -5%, rgba(0,255,133,0.07) 0%, rgba(34,211,238,0.04) 40%, transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/20 px-4 py-1.5 mb-5" style={{ background: "rgba(0,255,133,0.05)" }}>
          <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">Live · Season 1</span>
        </div>
        <h1 className="cinematic-heading text-[3.5rem] sm:text-8xl md:text-9xl text-ink leading-[0.82]">
          PLAYER<br />
          <span className="text-gradient-championship">Rankings</span>
        </h1>
        <p className="mt-4 text-sm sm:text-[15px] text-muted max-w-lg leading-relaxed">
          Zimbabwe&apos;s elite EA FC players — ranked by skill, wins, and consistency.
        </p>
        <div className="mt-5 flex items-center gap-4">
          {[
            { color: "linear-gradient(135deg, #ffd75e, #ffb800)", label: "Gold" },
            { color: "linear-gradient(135deg, #E8E8F0, #C8C8D2)", label: "Silver" },
            { color: "linear-gradient(135deg, #E8A860, #CD7F32)", label: "Bronze" },
            { color: "rgba(0,255,133,0.4)", label: "Elite", isSolid: true },
          ].map(({ color, label, isSolid }) => (
            <div key={label} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={isSolid ? { background: color } : { background: color }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  query, onQuery, city, onCity, division, onDivision,
  sortKey, sortDir, onSort, totalShown, totalAll,
}: {
  query: string;
  onQuery: (q: string) => void;
  city: City | "All";
  onCity: (c: City | "All") => void;
  division: Division | "All";
  onDivision: (d: Division | "All") => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  totalShown: number;
  totalAll: number;
}) {
  return (
    <div
      className="sticky z-30 backdrop-blur-xl border-b border-border-faint"
      style={{ top: 0, background: "rgba(13,13,15,0.80)" }}
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-6 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <label className="relative flex-1 min-w-0">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </span>
            <input
              type="search"
              inputMode="search"
              placeholder="Search for a Pro, Gamertag, or Club..."
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              className="w-full h-10 apple-input pl-10 pr-3 text-sm font-medium"
            />
          </label>
          <span className="hidden sm:inline-block text-[10px] font-black tracking-[0.2em] text-muted-soft px-2 tabular-nums">
            {totalShown}<span className="text-muted-faint">/</span>{totalAll}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto bc-no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <FilterChip label="City" value={city} onChange={(v) => onCity(v as City | "All")} options={[{ value: "All", label: "All" }, ...CITIES.map((c) => ({ value: c, label: c }))]} />
          <FilterChip label="Division" value={division} onChange={(v) => onDivision(v as Division | "All")} options={[{ value: "All", label: "All" }, ...DIVISIONS.map((d) => ({ value: d, label: d }))]} />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto bc-no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <span className="shrink-0 text-[10px] font-black tracking-[0.22em] text-muted-faint uppercase">Sort</span>
          {(["rank", "points", "winRate", "gd", "streak"] as const).map((k) => {
            const active = sortKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => onSort(k)}
                className={
                  "shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[10px] font-black tracking-[0.18em] uppercase transition-all duration-200 " +
                  (active
                    ? "bg-accent/12 text-accent border border-accent/20"
                    : "bg-bg-elevated/60 text-muted-soft border border-border-faint hover:text-ink hover:border-border-strong")
                }
              >
                {SORT_LABELS[k]}
                {active && <span className="text-[8px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  const active = value !== "All";
  const current = options.find((o) => o.value === value)?.label ?? "All";
  return (
    <label
      className={
        "shrink-0 relative inline-flex items-center h-9 pl-3 pr-8 rounded-[10px] cursor-pointer " +
        "text-[11px] font-black tracking-[0.18em] uppercase transition-all duration-200 " +
        (active ? "bg-bg-elevated/80 text-ink border border-accent/20" : "bg-bg-elevated/50 text-muted-soft border border-border-faint hover:text-ink hover:border-border-strong")
      }
    >
      <span className={active ? "text-accent mr-1.5" : "mr-1.5"}>{label}</span>
      <span className="text-ink-soft">{current}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={label}>
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
      <svg viewBox="0 0 24 24" className="absolute right-2 h-3 w-3 text-muted-faint pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
    </label>
  );
}

function RankingsList({ players, selectedId, onSelect, swipedId, onSwipe, loggedIn, onChallenge, challengeState }: { players: Player[]; selectedId: string | null; onSelect: (id: string) => void; swipedId: string | null; onSwipe: (id: string | null) => void; loggedIn: boolean; onChallenge: (id: string) => void; challengeState: Record<string, "idle" | "sending" | "sent" | "error">; }) {
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 20]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let minIdx = rest.length;
        let maxIdx = 0;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-idx"));
            if (idx < minIdx) minIdx = idx;
            if (idx > maxIdx) maxIdx = idx;
          }
        });
        if (minIdx <= maxIdx) {
          setVisibleRange([Math.max(0, minIdx - 4), Math.min(rest.length, maxIdx + 4)]);
        }
      },
      { root: null, rootMargin: "400px 0px", threshold: 0 }
    );

    const items = el.querySelectorAll("[data-idx]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [rest.length]);

  return (
    <>
      {top3.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          {top3.map((player, idx) => (
            <Top3Card key={player.id} player={player} index={idx} isSelected={player.id === selectedId} onSelect={() => onSelect(player.id)} club={clubByPlayerId(player.id) ?? null} loggedIn={loggedIn} onChallenge={onChallenge} challengeState={challengeState} />
          ))}
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-4 sm:mt-6">
          <div className="mb-3 sm:mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-faint">Rank 4+</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>
          <div ref={scrollRef} className="space-y-1.5 sm:space-y-2 rankings-scroll">
            {rest.map((player, idx) => {
              const isVisible = idx >= visibleRange[0] && idx <= visibleRange[1];
              return (
                <div key={player.id} data-idx={idx} className="rank-row-item">
                  {isVisible ? (
                    <SwipeableRankRow
                      player={player}
                      index={idx}
                      club={clubByPlayerId(player.id) ?? null}
                      isSelected={player.id === selectedId}
                      onSelect={() => onSelect(player.id)}
                      isSwiped={swipedId === player.id}
                      onSwipe={() => onSwipe(swipedId === player.id ? null : player.id)}
                      loggedIn={loggedIn}
                      onChallenge={onChallenge}
                      challengeState={challengeState}
                    />
                  ) : (
                    <div className="h-[76px] sm:h-[88px] rounded-[20px] sm:rounded-[22px]" style={{ background: "rgba(18,20,24,0.32)", border: "1px solid rgba(255,255,255,0.035)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function sortVal(p: Player): number {
  const stats = computeDerived(p);
  switch (true) {
    default: return p.rank;
  }
}

function Top3Card({ player, index, isSelected, onSelect, club, loggedIn, onChallenge, challengeState }: { player: Player; index: number; isSelected: boolean; onSelect: () => void; club: Club | null; loggedIn: boolean; onChallenge: (id: string) => void; challengeState: Record<string, "idle" | "sending" | "sent" | "error"> }) {
  const t = getTierTheme(player.rank);
  const stats = computeDerived(player);
  const delta = player.prev - player.rank;
  const gamertag = player.gamertag;
  const realName = player.name;
  const isChampion = player.rank === 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full text-left group"
    >
      <div
        className={`relative overflow-hidden rounded-[24px] sm:rounded-[28px] transition-all duration-200 group-hover:scale-[1.005] ${isSelected ? "ring-1 ring-accent/30" : ""}`}
        style={{
          background: "linear-gradient(135deg, rgba(18,20,24,0.60) 0%, rgba(14,16,20,0.70) 100%)",
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: t.spotlight, "--spotlight-max": isChampion ? "0.14" : "0.08" } as React.CSSProperties} />
        {isChampion && <span aria-hidden className="pointer-events-none absolute inset-0 light-streak" />}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] sm:w-[4px] rounded-l-[inherit]"
          style={{ background: t.gradientLine }}
        />

        {/* Watermark — contained so it never pushes foreground content */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden"
          style={{
            fontFamily: "var(--font-barlow), system-ui, sans-serif",
            fontSize: isChampion ? "7rem" : "5.5rem",
            fontWeight: 900,
            fontStyle: "italic",
            lineHeight: 0.85,
            letterSpacing: "-0.06em",
            color: isChampion ? "rgba(255,184,0,0.06)" : "rgba(255,255,255,0.04)",
            maxWidth: "60%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {gamertag.toUpperCase()}
        </span>

        <div className="relative z-10 flex items-stretch min-h-[120px] sm:min-h-[140px]">

          {/* LEFT: Rank number — fixed width, vertically centered */}
          <div className="shrink-0 flex items-center justify-center w-[56px] sm:w-[80px] md:w-[96px]"
            style={{ background: isChampion ? "linear-gradient(90deg, rgba(255,184,0,0.04), transparent 70%)" : undefined }}
          >
            <span
              className={`cinematic-heading leading-none tabular-nums ${isChampion ? "text-[64px] sm:text-[96px] bc-rank-pulse" : "text-[52px] sm:text-[80px]"} ${t.rankGlow || ""}`}
              style={{ color: t.rankColor, letterSpacing: "-0.06em" }}
            >
              {player.rank}
            </span>
          </div>

          {/* CENTER: Player identity — flex-1 min-w-0 for proper truncation */}
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 sm:gap-1.5 py-5 sm:py-6">
            {/* Row 1: GAMERTAG — always full width, never truncated */}
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="cinematic-heading text-xl sm:text-2xl md:text-3xl leading-none text-ink group-hover:text-accent transition-colors duration-150 truncate">
                {gamertag}
              </h3>
              {isChampion && (
                <span
                  className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-px text-[9px] font-black tracking-[0.2em] uppercase"
                  style={{
                    background: "rgba(255,184,0,0.10)",
                    border: "1px solid rgba(255,184,0,0.25)",
                    color: "#ffb800",
                    boxShadow: "0 4px 18px -4px rgba(255,184,0,0.35)",
                  }}
                >
                  ★ GOAT
                </span>
              )}
            </div>

            {/* Row 2: Real name — below gamertag, muted */}
            <p className="truncate text-[11px] sm:text-xs text-muted-soft leading-snug">
              {realName}
            </p>

            {/* Row 3: Badges row — grouped with gap-2, wraps cleanly */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {delta !== 0 && (
                <span
                  className={`shrink-0 inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-black tabular-nums ${delta > 0 ? "text-accent" : "text-negative"}`}
                  style={{ background: delta > 0 ? "rgba(0,255,133,0.08)" : "rgba(255,77,77,0.08)" }}
                >
                  {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
                </span>
              )}
              {player.rank <= 3 && !isChampion && (
                <span
                  className="shrink-0 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-black tracking-[0.15em] uppercase"
                  style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, color: t.accent }}
                >
                  {t.badgeText}
                </span>
              )}
              <span
                className="shrink-0 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accent }}
              >
                {player.city}
              </span>
              <span
                className="shrink-0 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "var(--muted-soft)" }}
              >
                ZW
              </span>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-muted-faint">
                CROSSPLAY
              </span>
              {club && (
                <span
                  className="shrink-0 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}
                >
                  <span className="text-accent/70 mr-1">⚑</span>{club.shortName}
                </span>
              )}
            </div>

            {/* Row 4: Win/Loss/Streak stats */}
            <div className="flex items-center gap-3 mt-0.5">
              <span className="bc-mono-score text-[11px] text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
              <span className="bc-mono-score text-[11px] text-muted-soft">{player.draws}<span className="text-muted-faint">D</span></span>
              <span className="bc-mono-score text-[11px] text-negative/80">{player.losses}<span className="text-muted-faint">L</span></span>
              {player.winStreak >= 3 && <span className="bc-mono-score text-[11px] text-accent">🔥{player.winStreak}</span>}
              <span className="bc-mono-score text-[11px] text-muted-faint">{Math.round(stats.winRate)}%</span>
            </div>

            {/* Row 5: Challenge button */}
            <div className="mt-2">
              <ChallengeButton playerId={player.id} loggedIn={loggedIn} onChallenge={onChallenge} state={challengeState[player.id] ?? "idle"} />
            </div>
          </div>

          {/* RIGHT: Points — dedicated container, fully separated */}
          <div className="shrink-0 flex flex-col items-end justify-center pl-2 pr-5 sm:pr-7">
            <span
              className="cinematic-heading tabular-nums leading-none text-3xl sm:text-5xl text-right"
              style={{ color: t.pointsColor }}
            >
              {player.points.toLocaleString()}
            </span>
            <span className="mt-1.5 text-[9px] font-black tracking-[0.28em] uppercase text-muted-faint text-right">
              PTS
            </span>
            <span className="mt-1 bc-mono-score text-[10px] tabular-nums text-muted-soft text-right">
              SR {Math.round(player.points / 3.12).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function SwipeableRankRow({ player, index, club, isSelected, onSelect, isSwiped, onSwipe, loggedIn, onChallenge, challengeState }: { player: Player; index: number; club: Club | null; isSelected: boolean; onSelect: () => void; isSwiped: boolean; onSwipe: () => void; loggedIn: boolean; onChallenge: (id: string) => void; challengeState: Record<string, "idle" | "sending" | "sent" | "error">; }) {
  const t = getTierTheme(player.rank);
  const stats = computeDerived(player);
  const delta = player.prev - player.rank;
  const displayName = player.gamertag;
  const realName = player.name;
  const isElite = player.rank <= 10;

  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const isScrolling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
    isScrolling.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwiping.current && !isScrolling.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        isScrolling.current = true;
        return;
      }
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        isSwiping.current = true;
      }
    }

    if (isSwiping.current && trackRef.current) {
      e.preventDefault();
      const clampedDx = Math.max(-140, Math.min(0, dx));
      if (!isSwiped) {
        trackRef.current.style.transform = `translateX(${clampedDx}px)`;
        trackRef.current.style.transition = "none";
      }
    }
  }, [isSwiped]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return;

    const dx = e.changedTouches[0].clientX - touchStartX.current;

    if (trackRef.current) {
      trackRef.current.style.transition = "transform 180ms cubic-bezier(0.25, 1, 0.5, 1)";
    }

    if (!isSwiped && dx < -50) {
      onSwipe();
    } else if (isSwiped && dx > 50) {
      onSwipe();
    } else {
      if (trackRef.current) {
        trackRef.current.style.transform = isSwiped ? "translateX(-140px)" : "translateX(0)";
      }
    }

    isSwiping.current = false;
    isScrolling.current = false;
  }, [isSwiped, onSwipe]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="block w-full text-left group rank-row-gpu touch-snap-subtle"
    >
      <div
        className={`relative overflow-hidden rounded-[20px] sm:rounded-[22px] swipe-reveal-outer rank-card-gpu ${isSelected ? "ring-1 ring-accent/30" : ""}`}
        style={{
          background: isElite
            ? "linear-gradient(135deg, rgba(0,255,133,0.03) 0%, rgba(16,18,22,0.55) 40%, rgba(10,12,14,0.65) 100%)"
            : "linear-gradient(135deg, rgba(18,20,24,0.45) 0%, rgba(16,18,22,0.50) 40%, rgba(10,12,14,0.60) 100%)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          ["--row-glow" as string]: `rgba(${isElite ? "0,255,133" : "34,211,238"},0.12)`,
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit]" style={{ background: t.gradientLine }} />
        {isElite && <span aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: t.spotlight, "--spotlight-max": "0.06" } as React.CSSProperties} />}

        <div
          ref={trackRef}
          className="swipe-reveal-track"
          data-swiped={isSwiped ? "true" : "false"}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transform: isSwiped ? "translateX(-140px)" : "translateX(0)" }}
        >
          <div className="swipe-reveal-main">
            <div className="relative z-10 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
              <div className="w-8 sm:w-10 text-center shrink-0">
                <span className="bc-headline tabular-nums text-lg sm:text-2xl leading-none" style={{ color: t.rankColor }}>
                  {player.rank}
                </span>
                {delta !== 0 && (
                  <p className={`font-mono text-[9px] tabular-nums mt-0.5 ${delta > 0 ? "text-accent" : "text-negative/80"}`}>
                    {delta > 0 ? "▲" : "▼"}{Math.abs(delta)}
                  </p>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm sm:text-[15px] font-bold text-ink group-hover:text-accent transition-colors duration-200 truncate">
                    {displayName}
                  </p>
                  {player.winStreak >= 3 && <span className="shrink-0 text-[9px]">🔥</span>}
                </div>
                <p className="text-[10px] text-muted-soft truncate mt-0.5">{realName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-[10px] tracking-wider text-muted-soft">@{player.gamertag}</span>
                  {club && (
                    <span className="inline-flex items-center rounded-[4px] px-1 py-px text-[9px] font-bold uppercase tracking-wider" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
                      {club.shortName}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-[4px] px-1 py-px text-[9px] font-bold uppercase tracking-wider" style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accent }}>
                    ZW
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-faint hidden sm:inline">CROSSPLAY</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2.5 sm:gap-3">
                <span className="bc-mono-score text-base sm:text-lg tabular-nums font-bold" style={{ color: t.pointsColor }}>
                  {player.points.toLocaleString()}
                </span>
                <span className="text-[9px] font-black tracking-[0.22em] uppercase text-muted-faint">PTS</span>
              </div>
            </div>
          </div>

          <div className="swipe-reveal-stats">
            <span className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[8px] font-black tracking-[0.18em] uppercase" style={{ background: "rgba(0,255,133,0.06)", border: "1px solid rgba(0,255,133,0.14)", color: "var(--accent)" }}>
              ← Swipe for stats
            </span>
            <div className="flex items-center gap-2 bc-mono-score text-[11px]">
              <span className="text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
              <span className="text-muted-soft">{player.draws}<span className="text-muted-faint">D</span></span>
              <span className="text-negative/80">{player.losses}<span className="text-muted-faint">L</span></span>
            </div>
            <div className="bc-mono-score text-[11px]">
              <span className="text-muted-soft">{Math.round(stats.winRate)}%</span>
              {player.winStreak >= 3 && <span className="ml-1 text-accent">🔥{player.winStreak}</span>}
            </div>
            <div className="text-[9px] text-muted-faint">
              {player.city}
            </div>
            <div className="mt-1">
              <ChallengeButton playerId={player.id} loggedIn={loggedIn} onChallenge={onChallenge} state={challengeState[player.id] ?? "idle"} compact />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function RankRow({ player, index, club, isSelected, onSelect, isSwiped, onSwipe }: { player: Player; index: number; club: Club | null; isSelected: boolean; onSelect: () => void; isSwiped: boolean; onSwipe: () => void; }) {
  return (
    <SwipeableRankRow
      player={player}
      index={index}
      club={club}
      isSelected={isSelected}
      onSelect={onSelect}
      isSwiped={isSwiped}
      onSwipe={onSwipe}
    />
  );
}

function EmptyState() {
  return (
    <div className="frosted-card p-12 text-center">
      <p className="bc-headline text-2xl text-muted">No players match</p>
      <p className="mt-1 text-[11px] font-bold tracking-[0.18em] text-muted-faint uppercase">
        Adjust filters or clear search
      </p>
    </div>
  );
}

function DetailSheet({ open, onClose, player, club }: { open: boolean; onClose: () => void; player: Player | null; club: Club | null }) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!player) return null;

  const stats = computeDerived(player);
  const aiReport = generateAIReport(player, stats);
  const t = getTierTheme(player.rank);
  const delta = player.prev - player.rank;
  const goalDiff = player.goalsFor - player.goalsAgainst;

  const onTouchStart = (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; setDragY(0); };
  const onTouchMove = (e: React.TouchEvent) => { if (startY.current == null) return; const dy = e.touches[0].clientY - startY.current; if (dy > 0) setDragY(dy); };
  const onTouchEnd = () => { if (dragY > 100) onClose(); setDragY(0); startY.current = null; };

  return (
    <div
      aria-hidden={!open}
      className={"fixed inset-0 z-50 " + (open ? "pointer-events-auto" : "pointer-events-none")}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={"absolute inset-0 bg-bg/60 backdrop-blur-sm transition-opacity duration-300 " + (open ? "opacity-100" : "opacity-0")}
      />
      <div
        className="absolute inset-x-0 bottom-0 lg:inset-0 lg:flex lg:items-center lg:justify-center"
      >
        <aside
          role="dialog"
          aria-modal="true"
          className={
            "w-full lg:w-auto lg:max-w-2xl max-h-[90vh] lg:max-h-[85vh] overflow-y-auto rounded-t-[28px] lg:rounded-[28px] " +
            "bg-bg-elevated/95 backdrop-blur-2xl border-t lg:border border-border-faint " +
            "transition-transform duration-300 ease-out"
          }
          style={{
            transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.30)",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="sticky top-0 z-10 flex items-center justify-center pt-3 pb-2 bg-bg-elevated/90 backdrop-blur-lg lg:hidden">
            <span className="h-1 w-10 rounded-full bg-border-strong" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 lg:top-6 lg:right-6 h-9 w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 20px rgba(0,230,118,0.10)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-ink-soft">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="px-4 sm:px-6 pb-8 pt-2 lg:pt-6">
            <DetailContent player={player} club={club} stats={stats} aiReport={aiReport} t={t} delta={delta} goalDiff={goalDiff} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailContent({ player, club, stats, aiReport, t, delta, goalDiff }: { player: Player; club: Club | null; stats: ReturnType<typeof computeDerived>; aiReport: string; t: TierTheme; delta: number; goalDiff: number }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-4 right-2 select-none leading-none"
        style={{
          fontFamily: "var(--font-barlow), system-ui, sans-serif",
          fontSize: ghostFontSize(player.gamertag),
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.06em",
          color: "transparent",
          WebkitTextStroke: "1px rgba(255,255,255,0.06)",
        }}
      >
        {player.gamertag}
      </span>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black tracking-[0.25em] text-accent">ACTIVE</span>
            <span className="h-3 w-px bg-border-strong" />
            <span className="text-[10px] font-bold tracking-[0.22em] text-muted-soft uppercase">{player.division}</span>
            {player.winStreak >= 3 && <span className="text-accent text-[10px]">🔥{player.winStreak}</span>}
          </div>
          <span className="bc-headline text-4xl sm:text-5xl leading-none text-accent tabular-nums">
            #{player.rank.toString().padStart(2, "0")}
          </span>
        </div>

        <div className="mt-5 flex items-end gap-4">
          <div
            className="grid place-items-center h-20 w-20 sm:h-24 sm:w-24 rounded-full border-2 shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
              borderColor: "rgba(0,255,133,0.30)",
              boxShadow: "0 0 40px -6px rgba(0,255,133,0.40)",
            }}
          >
            <span className="bc-headline text-4xl sm:text-5xl text-accent leading-none">
              {player.gamertag.charAt(0)}
            </span>
          </div>
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ background: t.accentBg, border: `1px solid ${t.accentBorder}`, color: t.accent }}>
                ZW
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-faint">CROSSPLAY</span>
            </div>
            <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-muted-soft uppercase">
              {player.city}
            </p>
            {club && (
              <p className="mt-0.5 text-[11px] font-bold tracking-[0.18em] text-muted-soft uppercase">
                {club.name}
              </p>
            )}
          </div>
        </div>

        <h2 className="bc-headline mt-4 leading-[0.85] text-ink text-[36px] sm:text-[48px] lg:text-[56px] break-words">
          {player.gamertag}
        </h2>
        <p className="mt-1 text-sm text-muted-soft">{player.name}</p>
        {delta !== 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider ${delta > 0 ? "text-accent" : "text-negative"}`} style={{ background: delta > 0 ? "rgba(0,255,133,0.08)" : "rgba(255,77,77,0.08)", border: `1px solid ${delta > 0 ? "rgba(0,255,133,0.20)" : "rgba(255,77,77,0.20)"}` }}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} {delta > 0 ? "positions up" : "positions down"}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, color: t.accent }}>
              {t.badgeText}
            </span>
          </div>
        )}
        {delta === 0 && player.rank <= 3 && (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}`, color: t.accent }}>
              {t.badgeText}
            </span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-px bg-bg-highlight border border-border-faint rounded-[14px] overflow-hidden">
          <Metric label="Streak" value={player.winStreak > 0 ? `${player.winStreak}W` : "0"} icon={<FireIcon />} accent={player.winStreak >= 5} />
          <Metric label="Win / Loss" value={`${player.wins} / ${player.losses}`} />
          <Metric label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
          <Metric label="G / Match" value={player.gpm.toFixed(2)} />
          <Metric label="Goal Diff" value={goalDiff > 0 ? `+${goalDiff}` : `${goalDiff}`} tone={goalDiff > 0 ? "positive" : goalDiff < 0 ? "negative" : "default"} />
          <Metric label="Matches" value={`${stats.matchesPlayed}`} />
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-black tracking-[0.25em] text-muted-soft uppercase mb-2">Form</p>
          <div className="flex items-center gap-1.5">
            {player.form.map((r, i) => (
              <span
                key={i}
                className={
                  "inline-grid place-items-center h-8 w-8 rounded-[8px] text-xs font-black italic " +
                  (r === "W"
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : r === "L"
                      ? "bg-negative/12 text-negative border border-negative/20"
                      : "bg-bg-highlight text-muted-soft border border-border-faint")
                }
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border-faint">
          <p className="text-[10px] font-black tracking-[0.25em] text-muted-soft uppercase mb-4">Tactical Matrix</p>
          <div className="space-y-4">
            <TacticalBar label="Offensive Threat" value={stats.offensiveThreat} gradient="from-cyan-400 to-blue-500" icon="⚔️" />
            <TacticalBar label="Defensive Integrity" value={stats.defensiveIntegrity} gradient="from-purple-400 to-indigo-500" icon="🛡️" />
            <TacticalBar label="Control Metric" value={stats.controlMetric} gradient="from-teal-400 to-emerald-500" icon="🎯" />
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border-faint">
          <div className="rounded-[18px] p-4 sm:p-5" style={{ background: "rgba(0,230,118,0.03)", border: "1px solid rgba(0,230,118,0.08)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-8 w-8 rounded-[10px] grid place-items-center shrink-0" style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.12), rgba(34,211,238,0.08))", border: "1px solid rgba(0,230,118,0.16)" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-accent">
                  <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
                  <path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93" />
                  <path d="M8.56 13.07A8 8 0 0 0 12 20a8 8 0 0 0 3.44-6.93" />
                  <circle cx="12" cy="6" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] text-accent uppercase">AI Intelligence Report</p>
                <p className="text-[9px] text-muted-faint">Automated tactical analysis</p>
              </div>
            </div>
            <p className="text-[13px] sm:text-[14px] text-ink-soft leading-relaxed">
              {aiReport}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border-faint grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.25em] text-muted-soft uppercase">Prize Pool</p>
            <p className="mt-1 bc-headline text-2xl text-ink tabular-nums">${player.prizeMoney.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black tracking-[0.25em] text-muted-soft uppercase">Rig</p>
            <p className="mt-1 text-[11px] text-ink-soft leading-tight truncate">{player.hardware.console}</p>
            <p className="text-[10px] text-muted-soft truncate">{player.hardware.controller}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon, accent = false, tone = "default" }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean; tone?: "default" | "positive" | "negative" }) {
  const valueClass = tone === "positive" ? "text-accent" : tone === "negative" ? "text-negative" : accent ? "text-accent" : "text-ink";
  return (
    <div className="bg-bg/60 px-4 py-4">
      <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.25em] text-muted-soft uppercase">{icon}{label}</p>
      <p className={"mt-1 bc-headline text-3xl tabular-nums leading-none " + valueClass}>{value}</p>
    </div>
  );
}

function TacticalBar({ label, value, gradient, icon }: { label: string; value: number; gradient: string; icon: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-soft">
          <span className="text-[13px]">{icon}</span>
          {label}
        </span>
        <span className="bc-mono-score text-[11px] font-bold tabular-nums text-ink">{value}/100</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div
          className="h-full rounded-full progress-fill-animated"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, var(--tw-gradient-stops))`,
            backgroundImage: gradient.includes("cyan") ? "linear-gradient(90deg, #22d3ee, #3b82f6)" : gradient.includes("purple") ? "linear-gradient(90deg, #a855f7, #6366f1)" : "linear-gradient(90deg, #14b8a6, #34d399)",
            boxShadow: gradient.includes("cyan") ? "0 0 12px rgba(34,211,238,0.30)" : gradient.includes("purple") ? "0 0 12px rgba(168,85,247,0.30)" : "0 0 12px rgba(52,211,153,0.30)",
          }}
        />
      </div>
    </div>
  );
}

function ChallengeButton({ playerId, loggedIn, onChallenge, state, compact }: { playerId: string; loggedIn: boolean; onChallenge: (id: string) => void; state: "idle" | "sending" | "sent" | "error"; compact?: boolean }) {
  if (state === "sent") {
    return (
      <span className={
        "inline-flex items-center justify-center gap-1.5 rounded-[8px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 " +
        (compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]")
      }>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}><path d="M20 6L9 17l-5-5" /></svg>
        Sent
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className={
        "inline-flex items-center justify-center rounded-[8px] font-bold uppercase tracking-wider text-negative/80 " +
        (compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]")
      }>
        Failed
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => onChallenge(playerId, e)}
      disabled={state === "sending"}
      className={
        "inline-flex items-center justify-center gap-1.5 rounded-[8px] font-bold uppercase tracking-wider transition-all duration-150 " +
        (loggedIn
          ? "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-95 " +
            (compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]")
          : "bg-bg-elevated/60 text-muted-soft border border-border-faint hover:text-ink hover:border-border-strong " +
            (compact ? "px-2 py-1 text-[8px]" : "px-3 py-1.5 text-[10px]")
      )
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={compact ? "h-2.5 w-2.5" : "h-3 w-3"}>
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {state === "sending" ? "..." : loggedIn ? "Challenge" : "Sign in to Challenge"}
    </button>
  );
}

function FireIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-orange" aria-hidden>
      <path d="M12 2c.5 4-2.5 5-2.5 8 0 1.66 1.12 3 2.5 3s2.5-1.34 2.5-3c0-1.5-1-2-1-3 2 .5 4.5 3.5 4.5 7 0 3.87-3.13 7-7 7s-7-3.13-7-7c0-4 4-6.5 4-9 0-1.5-.5-2.5-1-3 2 0 5 1 5 0Z" />
    </svg>
  );
}

function ghostFontSize(name: string): string {
  const len = name.length;
  if (len <= 4) return "240px";
  if (len <= 6) return "180px";
  if (len <= 8) return "140px";
  return "110px";
}