"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PLAYERS,
  CITIES,
  DIVISIONS,
  type Player,
  type Division,
  type City,
  type FormResult,
} from "@/lib/players";
import { CLUBS, clubByPlayerId } from "@/lib/clubs";

type SortKey = "rank" | "points" | "wins";
type SortDir = "asc" | "desc";

export function Leaderboard() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | "All">("All");
  const [division, setDivision] = useState<Division | "All">("All");
  const [clubId, setClubId] = useState<string | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = PLAYERS.filter((p) => {
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
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, city, division, clubId, sortKey, sortDir]);

  const open = openId ? PLAYERS.find((p) => p.id === openId) ?? null : null;

  function setSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-4">
      <Toolbar
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
        onSort={setSort}
        resultCount={rows.length}
      />

      <RankingsTable rows={rows} onOpen={setOpenId} />

      <PlayerDrawer player={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Toolbar({
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
  resultCount,
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
  resultCount: number;
}) {
  return (
    <div className="frosted-card-sm overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <label className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted-soft">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            placeholder="Search player, gamertag, club…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full h-9 apple-input pl-9 pr-3 text-sm"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Select
            label="City"
            value={city}
            onChange={(v) => onCity(v as City | "All")}
            options={["All", ...CITIES]}
          />
          <Select
            label="Division"
            value={division}
            onChange={(v) => onDivision(v as Division | "All")}
            options={["All", ...DIVISIONS]}
          />
          <Select
            label="Club"
            value={clubId}
            onChange={(v) => onClubId(v)}
            options={[
              { value: "All", label: "All" },
              ...CLUBS.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2 border-t border-border-faint flex flex-wrap items-center gap-2 text-xs text-muted-soft">
        <span className="font-medium uppercase tracking-wide text-[11px]">Sort</span>
        {(["rank", "points", "wins"] as const).map((k) => {
          const active = sortKey === k;
          const labels: Record<SortKey, string> = {
            rank: "Rank",
            points: "Points",
            wins: "Wins",
          };
          return (
            <button
              key={k}
              onClick={() => onSort(k)}
              className={
                "inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[12px] transition-all duration-200 " +
                (active
                  ? "bg-accent/12 text-accent border border-accent/20"
                  : "border border-border-faint text-muted-soft hover:border-border-strong hover:bg-bg-highlight/50")
              }
            >
              {labels[k]}
              {active && (
                <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
              )}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[11px] text-muted-soft">
          {resultCount} of {PLAYERS.length} players
        </span>
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<string | { value: string; label: string }>;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="absolute -top-2 left-2 px-1 bg-bg-elevated/80 text-[9px] font-medium uppercase tracking-wider text-muted-soft">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 apple-input pl-3 pr-8 text-xs cursor-pointer"
      >
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-faint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

function RankingsTable({
  rows,
  onOpen,
}: {
  rows: Player[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="frosted-card-sm overflow-hidden">
      <div className="overflow-x-auto" style={{ scrollBehavior: "smooth" }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted-soft text-[11px] uppercase tracking-wider">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-bg-highlight/80 backdrop-blur-sm border-b border-border-faint w-12 px-3 py-2.5 font-medium"
              >
                #
              </th>
              <th
                scope="col"
                className="sticky left-12 z-20 bg-bg-highlight/80 backdrop-blur-sm sticky-shadow border-b border-border-faint min-w-[210px] px-3 py-2.5 font-medium"
              >
                Player
              </th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">Pts</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium">Form</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">P</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right text-accent">W</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">D</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right text-negative">L</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">GF</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">GA</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right">GD</th>
              <th scope="col" className="bg-bg-highlight/80 border-b border-border-faint px-3 py-2.5 font-medium text-right pr-4">G/M</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <PlayerRow key={p.id} player={p} index={i} onOpen={() => onOpen(p.id)} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-12 text-center text-muted-soft">
                  No players match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  index,
  onOpen,
}: {
  player: Player;
  index: number;
  onOpen: () => void;
}) {
  const club = clubByPlayerId(player.id);
  const matches = player.wins + player.losses + player.draws;
  const gd = player.goalsFor - player.goalsAgainst;
  const topThree = player.rank <= 3;
  const rowBg = topThree ? "bg-accent-soft/30" : "bg-transparent";
  const stickyBg = topThree ? "bg-accent-soft/30" : "bg-transparent";

  return (
    <tr
      onClick={onOpen}
      className={
        "cursor-pointer border-b border-border-faint last:border-b-0 transition-colors duration-200 " +
        rowBg +
        " hover:bg-bg-highlight/50"
      }
    >
      <td
        className={
          "sticky left-0 z-10 w-12 px-3 py-2.5 align-middle " + stickyBg
        }
      >
        <span className="font-mono text-sm text-ink tabular-nums">
          {player.rank}
        </span>
      </td>
      <td
        className={
          "sticky left-12 z-10 sticky-shadow min-w-[210px] px-3 py-2.5 align-middle " +
          stickyBg
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          <RankDelta rank={player.rank} prev={player.prev} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate font-semibold text-ink text-sm">
                {player.name}
              </p>
              <DivisionTag division={player.division} />
            </div>
            <p className="truncate text-[11px] text-muted-soft">
              <span className="font-mono">@{player.gamertag}</span>
              {club && <> · {club.name}</>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right align-middle">
        <span className="font-mono text-base text-ink font-semibold tabular-nums">
          {player.points.toLocaleString()}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <FormStrip form={player.form} />
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {matches}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-accent tabular-nums">
        {player.wins}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {player.draws}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-negative tabular-nums">
        {player.losses}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {player.goalsFor}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {player.goalsAgainst}
      </td>
      <td
        className={
          "px-3 py-2.5 text-right align-middle font-mono tabular-nums " +
          (gd > 0 ? "text-accent" : gd < 0 ? "text-negative" : "text-ink-soft")
        }
      >
        {gd > 0 ? `+${gd}` : gd}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink tabular-nums pr-4">
        {player.gpm.toFixed(2)}
      </td>
    </tr>
  );
}

function RankDelta({ rank, prev }: { rank: number; prev: number }) {
  const diff = prev - rank;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center justify-center w-5 text-muted-faint" aria-label="No change">
        —
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums " +
        (up ? "text-accent" : "text-negative")
      }
      aria-label={up ? `Up ${Math.abs(diff)}` : `Down ${Math.abs(diff)}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(diff)}
    </span>
  );
}

function DivisionTag({ division }: { division: Division }) {
  const cls: Record<Division, string> = {
    Elite: "border-gold/40 text-gold bg-gold/5",
    Pro: "border-accent/30 text-accent bg-accent-soft",
    Challenger: "border-border-strong text-ink-soft bg-bg-highlight/80",
    Rookie: "border-border text-muted-soft bg-transparent",
  };
  return (
    <span
      className={
        "shrink-0 inline-flex items-center rounded-[6px] border px-1.5 py-px text-[9px] font-medium uppercase tracking-wider " +
        cls[division]
      }
    >
      {division}
    </span>
  );
}

function FormStrip({ form }: { form: FormResult[] }) {
  return (
    <div className="flex items-center gap-1" aria-label="Last five results">
      {form.map((r, i) => {
        const cls =
          r === "W"
            ? "bg-accent/15 text-accent border border-accent/25"
            : r === "L"
              ? "bg-negative/12 text-negative border border-negative/20"
              : "bg-bg-highlight text-ink-soft border border-border-faint";
        return (
          <span
            key={i}
            title={r === "W" ? "Win" : r === "L" ? "Loss" : "Draw"}
            className={
              "inline-grid place-items-center h-5 w-5 rounded-[6px] text-[10px] font-bold " +
              cls
            }
          >
            {r}
          </span>
        );
      })}
    </div>
  );
}

function PlayerDrawer({
  player,
  onClose,
}: {
  player: Player | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [player, onClose]);

  return (
    <div
      aria-hidden={!player}
      className={
        "fixed inset-0 z-[60] transition-opacity duration-200 " +
        (player ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
      }
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-bg/50 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={
          "absolute right-0 top-0 h-full w-full sm:max-w-md bg-bg-elevated/95 backdrop-blur-2xl border-l border-border-faint transition-transform duration-300 ease-out " +
          (player ? "translate-x-0" : "translate-x-full")
        }
        style={{ boxShadow: '-8px 0 40px rgba(0,0,0,0.25)' }}
      >
        {player && <DrawerBody player={player} onClose={onClose} />}
      </aside>
    </div>
  );
}

function DrawerBody({ player, onClose }: { player: Player; onClose: () => void }) {
  const club = clubByPlayerId(player.id);
  const total = player.wins + player.losses + player.draws;
  const winRate = total > 0 ? (player.wins / total) * 100 : 0;
  const goalDiff = player.goalsFor - player.goalsAgainst;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 h-12 border-b border-border-faint">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-soft">
          Player Profile
        </p>
        <button
          onClick={onClose}
          className="h-8 w-8 grid place-items-center rounded-[10px] text-muted-soft hover:text-ink hover:bg-bg-highlight transition-all duration-200"
          aria-label="Close drawer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <header>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl text-ink leading-none tabular-nums">
              #{player.rank}
            </span>
            <RankDelta rank={player.rank} prev={player.prev} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-ink leading-tight">
            {player.name}
          </p>
          <p className="mt-0.5 font-mono text-sm text-muted-soft">
            @{player.gamertag}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <DivisionTag division={player.division} />
            <span className="inline-flex items-center rounded-[6px] border border-border-faint px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-ink-soft bg-bg-highlight/80">
              {player.city}
            </span>
            {club && (
              <span className="inline-flex items-center rounded-[6px] border border-border-faint px-1.5 py-px text-[10px] font-medium uppercase tracking-wider text-ink-soft bg-bg-highlight/80">
                {club.name}
              </span>
            )}
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 border border-border-faint rounded-[14px] overflow-hidden divide-x divide-y divide-border-faint bg-bg-elevated/60">
          <Stat label="Points" value={player.points.toLocaleString()} />
          <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} />
          <Stat label="G / Match" value={player.gpm.toFixed(2)} />
          <Stat
            label="Goal Diff"
            value={`${goalDiff >= 0 ? "+" : ""}${goalDiff}`}
            tone={goalDiff > 0 ? "positive" : goalDiff < 0 ? "negative" : "default"}
          />
          <Stat label="Streak" value={player.winStreak.toString()} />
          <Stat label="Prize" value={`$${player.prizeMoney.toLocaleString()}`} />
        </section>

        <section>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-soft mb-2">
            Form (last 5)
          </p>
          <div className="flex items-center gap-1.5">
            {player.form.map((r, i) => (
              <span
                key={i}
                className={
                  "inline-grid place-items-center h-9 w-9 rounded-[8px] text-sm font-bold " +
                  (r === "W"
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : r === "L"
                      ? "bg-negative/12 text-negative border border-negative/20"
                      : "bg-bg-highlight text-ink-soft border border-border-faint")
                }
              >
                {r}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <ResultPill label="Wins" value={player.wins} tone="positive" />
            <ResultPill label="Draws" value={player.draws} tone="default" />
            <ResultPill label="Losses" value={player.losses} tone="negative" />
          </div>
        </section>

        <section>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-soft mb-2">
            Goals
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="frosted-card-sm px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-soft">Scored</p>
              <p className="font-mono text-base text-ink tabular-nums">{player.goalsFor}</p>
            </div>
            <div className="frosted-card-sm px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-soft">Conceded</p>
              <p className="font-mono text-base text-ink tabular-nums">{player.goalsAgainst}</p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-soft mb-2">
            Hardware
          </p>
          <dl className="frosted-card-sm divide-y divide-border-faint text-xs">
            <SpecRow label="Console" value={player.hardware.console} />
            <SpecRow label="Controller" value={player.hardware.controller} />
            <SpecRow label="Display" value={player.hardware.monitor} />
          </dl>
        </section>

        <button
          disabled
          aria-disabled="true"
          title="Challenges arrive in Phase 2"
          className="w-full h-10 rounded-[14px] border border-border-faint bg-bg-highlight/50 text-muted-soft text-sm font-medium tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
        >
          Challenge Player
          <span className="pill-accent text-[8px] rounded-full px-1.5 py-0.5">
            Phase 2
          </span>
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative";
}) {
  const cls =
    tone === "positive"
      ? "text-accent"
      : tone === "negative"
        ? "text-negative"
        : "text-ink";
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-soft">{label}</p>
      <p className={"mt-0.5 font-mono text-base tabular-nums " + cls}>{value}</p>
    </div>
  );
}

function ResultPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative" | "default";
}) {
  const cls =
    tone === "positive"
      ? "text-accent"
      : tone === "negative"
        ? "text-negative"
        : "text-ink-soft";
  return (
    <div className="frosted-card-sm px-2.5 py-1.5 flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider text-muted-soft">{label}</span>
      <span className={"font-mono tabular-nums " + cls}>{value}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-muted-soft">{label}</dt>
      <dd className="text-ink text-right truncate font-mono">{value}</dd>
    </div>
  );
}