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

type SortKey = "rank" | "points" | "wins" | "gpm";
type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  rank: "Rank",
  points: "Points",
  wins: "Wins",
  gpm: "G/M",
};

export function Leaderboard() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | "All">("All");
  const [division, setDivision] = useState<Division | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = PLAYERS.filter((p) => {
      if (city !== "All" && p.city !== city) return false;
      if (division !== "All" && p.division !== division) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.gamertag.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [query, city, division, sortKey, sortDir]);

  const open = openId ? PLAYERS.find((p) => p.id === openId) ?? null : null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "rank" ? "asc" : "desc");
    }
  }

  return (
    <div className="space-y-5">
      <CommandBar
        query={query}
        onQuery={setQuery}
        city={city}
        onCity={setCity}
        division={division}
        onDivision={setDivision}
        resultCount={rows.length}
      />

      <SortBar sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />

      <ol className="space-y-2">
        {rows.map((p) => (
          <li key={p.id}>
            <PlayerRow player={p} onOpen={() => setOpenId(p.id)} />
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-br/70 bg-s1/60 px-4 py-10 text-center">
            <p className="font-display tracking-wider text-text text-2xl">
              NO MATCHES
            </p>
            <p className="font-mono text-xs text-muted mt-1">
              Try clearing a filter or resetting the search.
            </p>
          </li>
        )}
      </ol>

      <PlayerDrawer player={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

function CommandBar({
  query,
  onQuery,
  city,
  onCity,
  division,
  onDivision,
  resultCount,
}: {
  query: string;
  onQuery: (q: string) => void;
  city: City | "All";
  onCity: (c: City | "All") => void;
  division: Division | "All";
  onDivision: (d: Division | "All") => void;
  resultCount: number;
}) {
  return (
    <div className="rounded-2xl border border-br/70 glass p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1 group">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted group-focus-within:text-neon transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            placeholder="Search player, gamertag, city…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full h-11 rounded-lg bg-s2/80 border border-br/80 pl-9 pr-3 font-mono text-sm text-text placeholder:text-muted/70 focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition"
          />
        </label>

        <div className="flex gap-2">
          <Select
            label="City"
            value={city}
            onChange={(v) => onCity(v as City | "All")}
            options={["All", ...CITIES]}
          />
          <Select
            label="Div"
            value={division}
            onChange={(v) => onDivision(v as Division | "All")}
            options={["All", ...DIVISIONS]}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-muted">
        <span>
          <span className="text-neon">{resultCount}</span> /{" "}
          {PLAYERS.length} players
        </span>
        <span className="hidden sm:inline">
          ZW · Season 1 · Week 12
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
  options: readonly string[];
}) {
  return (
    <label className="relative">
      <span className="absolute -top-2 left-2 px-1 bg-bg text-[9px] font-mono uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-11 rounded-lg bg-s2/80 border border-br/80 pl-3 pr-8 font-mono text-xs text-text focus:outline-none focus:border-neon focus:ring-2 focus:ring-neon/20 transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-s1 text-text">
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

function SortBar({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const KEYS: SortKey[] = ["rank", "points", "wins", "gpm"];
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted pr-1 shrink-0">
        Sort
      </span>
      {KEYS.map((k) => {
        const active = sortKey === k;
        return (
          <button
            key={k}
            onClick={() => onSort(k)}
            className={
              "shrink-0 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-wider border transition " +
              (active
                ? "border-neon/60 bg-neon/10 text-neon"
                : "border-br/70 bg-s1/60 text-muted hover:text-text hover:border-br")
            }
          >
            {SORT_LABEL[k]}
            {active && (
              <span aria-hidden className="text-[9px]">
                {sortDir === "asc" ? "▲" : "▼"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlayerRow({
  player,
  onOpen,
}: {
  player: Player;
  onOpen: () => void;
}) {
  const isElite = player.division === "Elite";
  return (
    <button
      onClick={onOpen}
      className={
        "w-full text-left rounded-xl border bg-s1/60 hover:bg-s2 transition-all duration-200 hover:border-neon/50 hover:-translate-y-px " +
        (isElite ? "border-neon/30 elite-glow" : "border-br/70")
      }
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <RankBadge rank={player.rank} elite={isElite} />
          <RankDelta rank={player.rank} prev={player.prev} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="truncate font-display tracking-wide text-text text-lg sm:text-xl">
              {player.name}
            </p>
            <DivisionPill division={player.division} />
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[11px] text-muted truncate">
            <span className="text-neon/90">@{player.gamertag}</span>
            <span className="opacity-50">·</span>
            <span>{player.city}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <FormStrip form={player.form} />
            <span className="hidden sm:inline font-mono text-[10px] text-muted">
              W {player.wins} · L {player.losses} · D {player.draws}
            </span>
          </div>
        </div>

        <div className="text-right">
          <p className="font-mono text-xs text-muted leading-none">PTS</p>
          <p className="font-mono text-xl sm:text-2xl text-text leading-tight tabular-nums">
            {player.points.toLocaleString()}
          </p>
          <p className="font-mono text-[10px] text-muted mt-0.5">
            G/M <span className="text-text">{player.gpm.toFixed(2)}</span>
          </p>
        </div>
      </div>
    </button>
  );
}

function RankBadge({ rank, elite }: { rank: number; elite: boolean }) {
  return (
    <div
      className={
        "h-11 w-11 grid place-items-center rounded-lg border font-display text-2xl leading-none tabular-nums " +
        (elite
          ? "border-neon/50 bg-neon/10 text-neon"
          : "border-br/80 bg-s2 text-text")
      }
    >
      {rank}
    </div>
  );
}

function RankDelta({ rank, prev }: { rank: number; prev: number }) {
  const diff = prev - rank;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-[10px] font-mono text-muted">
        —
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 h-5 px-1.5 rounded text-[10px] font-mono " +
        (up ? "text-neon bg-neon/10" : "text-red bg-red/10")
      }
      style={up ? undefined : { color: "var(--red)", background: "rgba(255,59,59,0.1)" }}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(diff)}
    </span>
  );
}

function DivisionPill({ division }: { division: Division }) {
  const styles: Record<Division, string> = {
    Elite: "border-neon/50 text-neon bg-neon/10",
    Pro: "border-gold/50 text-gold bg-gold/10",
    Challenger: "border-br text-text bg-s2",
    Rookie: "border-br/70 text-muted bg-s1",
  };
  return (
    <span
      className={
        "shrink-0 inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider " +
        styles[division]
      }
    >
      {division}
    </span>
  );
}

function FormStrip({ form }: { form: FormResult[] }) {
  return (
    <div className="flex items-center gap-1" aria-label="Recent form">
      {form.map((r, i) => {
        const cls =
          r === "W"
            ? "bg-neon shadow-[0_0_8px_rgba(0,255,87,0.55)]"
            : r === "L"
              ? "bg-red"
              : "bg-muted/60";
        return (
          <span
            key={i}
            title={r === "W" ? "Win" : r === "L" ? "Loss" : "Draw"}
            className={"h-1.5 w-4 rounded-sm " + cls}
            style={r === "L" ? { background: "var(--red)" } : undefined}
          />
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
        "fixed inset-0 z-[60] transition-opacity duration-300 " +
        (player ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
      }
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={
          "absolute right-0 top-0 h-full w-full sm:max-w-md border-l border-br/70 glass transition-transform duration-300 " +
          (player ? "translate-x-0" : "translate-x-full")
        }
      >
        {player && <DrawerBody player={player} onClose={onClose} />}
      </aside>
    </div>
  );
}

function DrawerBody({ player, onClose }: { player: Player; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const total = player.wins + player.losses + player.draws;
  const winRate = total > 0 ? (player.wins / total) * 100 : 0;
  const goalDiff = player.goalsFor - player.goalsAgainst;

  return (
    <div
      className={
        "h-full flex flex-col transition-all duration-300 ease-out " +
        (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
      }
    >
      <div className="flex items-center justify-between px-5 h-14 border-b border-br/70">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Player Profile
        </p>
        <button
          onClick={onClose}
          className="h-8 w-8 grid place-items-center rounded-md border border-br/70 text-muted hover:text-text hover:border-br transition"
          aria-label="Close drawer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <header className="flex items-start gap-4">
          <div className="h-16 w-16 grid place-items-center rounded-xl border border-neon/40 bg-neon/10 elite-glow">
            <span className="font-display text-3xl text-neon leading-none tabular-nums">
              {player.rank}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display tracking-wide text-text text-3xl leading-none">
              {player.name}
            </p>
            <p className="mt-1 font-mono text-xs text-neon">
              @{player.gamertag}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <DivisionPill division={player.division} />
              <span className="inline-flex items-center rounded-full border border-br px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted bg-s2">
                {player.city}
              </span>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-2">
          <Stat label="Points" value={player.points.toLocaleString()} accent="neon" />
          <Stat
            label="Win Rate"
            value={`${winRate.toFixed(1)}%`}
            accent={winRate > 70 ? "neon" : winRate > 50 ? "gold" : "muted"}
          />
          <Stat label="Win Streak" value={`${player.winStreak}`} accent={player.winStreak >= 5 ? "neon" : "muted"} />
          <Stat label="Goals / Match" value={player.gpm.toFixed(2)} accent="muted" />
          <Stat
            label="Goal Diff"
            value={`${goalDiff >= 0 ? "+" : ""}${goalDiff}`}
            accent={goalDiff > 0 ? "neon" : "red"}
          />
          <Stat
            label="Prize Money"
            value={`$${player.prizeMoney.toLocaleString()}`}
            accent="gold"
          />
        </section>

        <section className="rounded-xl border border-br/70 bg-s1/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Recent Form
          </p>
          <div className="mt-3 flex items-center gap-2">
            {player.form.map((r, i) => (
              <span
                key={i}
                className={
                  "h-7 w-7 grid place-items-center rounded-md font-display text-sm " +
                  (r === "W"
                    ? "bg-neon/15 text-neon border border-neon/40"
                    : r === "L"
                      ? "border"
                      : "bg-s2 text-muted border border-br")
                }
                style={
                  r === "L"
                    ? {
                        background: "rgba(255,59,59,0.12)",
                        color: "var(--red)",
                        borderColor: "rgba(255,59,59,0.4)",
                      }
                    : undefined
                }
              >
                {r}
              </span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[11px]">
            <Pill label="W" value={player.wins} tone="neon" />
            <Pill label="D" value={player.draws} tone="muted" />
            <Pill label="L" value={player.losses} tone="red" />
          </div>
        </section>

        <section className="rounded-xl border border-br/70 bg-s1/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Goals
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
            <div className="rounded-md border border-br/70 bg-s2 px-3 py-2">
              <p className="text-[10px] text-muted">For</p>
              <p className="text-text tabular-nums">{player.goalsFor}</p>
            </div>
            <div className="rounded-md border border-br/70 bg-s2 px-3 py-2">
              <p className="text-[10px] text-muted">Against</p>
              <p className="text-text tabular-nums">{player.goalsAgainst}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-br/70 bg-s1/60 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Hardware Spec
          </p>
          <dl className="mt-3 space-y-2 font-mono text-xs">
            <SpecRow label="Console" value={player.hardware.console} />
            <SpecRow label="Controller" value={player.hardware.controller} />
            <SpecRow label="Display" value={player.hardware.monitor} />
          </dl>
        </section>

        <button
          disabled
          aria-disabled="true"
          title="Challenges arrive in Phase 2"
          className="w-full h-12 rounded-lg border border-br/80 bg-s2 text-muted font-display tracking-[0.15em] text-base cursor-not-allowed flex items-center justify-center gap-2"
        >
          CHALLENGE PLAYER
          <span className="font-mono text-[9px] uppercase tracking-wider rounded-full border border-br px-1.5 py-0.5 text-muted">
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
  accent,
}: {
  label: string;
  value: string;
  accent: "neon" | "gold" | "red" | "muted";
}) {
  const cls =
    accent === "neon"
      ? "text-neon"
      : accent === "gold"
        ? "text-gold"
        : accent === "red"
          ? ""
          : "text-text";
  return (
    <div className="rounded-xl border border-br/70 bg-s1/60 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
      <p
        className={"mt-1 font-mono text-xl tabular-nums " + cls}
        style={accent === "red" ? { color: "var(--red)" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neon" | "muted" | "red";
}) {
  const cls =
    tone === "neon"
      ? "border-neon/40 bg-neon/10 text-neon"
      : tone === "red"
        ? ""
        : "border-br bg-s2 text-muted";
  return (
    <div
      className={"flex items-center justify-between rounded-md border px-2.5 py-1.5 " + cls}
      style={
        tone === "red"
          ? {
              borderColor: "rgba(255,59,59,0.4)",
              background: "rgba(255,59,59,0.1)",
              color: "var(--red)",
            }
          : undefined
      }
    >
      <span className="text-[10px] uppercase tracking-wider opacity-80">
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-br/40 pb-1.5 last:border-b-0 last:pb-0">
      <dt className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="text-text text-right truncate">{value}</dd>
    </div>
  );
}
