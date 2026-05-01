"use client";

import { useEffect, useMemo, useState } from "react";
import { CLUBS, type Club } from "@/lib/clubs";
import { PLAYERS, CITIES, type City } from "@/lib/players";

type SortKey = "rank" | "points" | "wins";
type SortDir = "asc" | "desc";

export function ClubsTable() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<City | "All">("All");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = CLUBS.filter((c) => {
      if (city !== "All" && c.city !== city) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.manager.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, city, sortKey, sortDir]);

  const open = openId ? CLUBS.find((c) => c.id === openId) ?? null : null;

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
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={setSort}
        resultCount={rows.length}
      />
      <Table rows={rows} onOpen={setOpenId} />
      <ClubDrawer club={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Toolbar({
  query,
  onQuery,
  city,
  onCity,
  sortKey,
  sortDir,
  onSort,
  resultCount,
}: {
  query: string;
  onQuery: (q: string) => void;
  city: City | "All";
  onCity: (c: City | "All") => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  resultCount: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <label className="relative flex-1 min-w-[200px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            inputMode="search"
            placeholder="Search club, manager, city…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            className="w-full h-9 rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted-soft focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <SelectField
            label="City"
            value={city}
            onChange={(v) => onCity(v as City | "All")}
            options={["All", ...CITIES]}
          />
        </div>
      </div>
      <div className="px-3 sm:px-4 py-2 border-t border-border flex flex-wrap items-center gap-2 text-xs text-muted">
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
                "inline-flex items-center gap-1 h-7 px-2.5 rounded text-[12px] border transition " +
                (active
                  ? "border-accent text-accent bg-accent-soft"
                  : "border-border text-ink-soft hover:border-border-strong hover:bg-surface-2")
              }
            >
              {labels[k]}
              {active && (
                <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>
              )}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[11px] text-muted">
          {resultCount} of {CLUBS.length} clubs
        </span>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<string>;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="absolute -top-2 left-2 px-1 bg-surface text-[9px] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 rounded-md border border-border bg-surface pl-3 pr-8 text-xs text-ink focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-muted-soft">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </span>
    </label>
  );
}

function Table({
  rows,
  onOpen,
}: {
  rows: Club[];
  onOpen: (id: string) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto" style={{ scrollBehavior: "smooth" }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-muted text-[11px] uppercase tracking-wider">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-surface-2 border-b border-border w-12 px-3 py-2.5 font-medium"
              >
                #
              </th>
              <th
                scope="col"
                className="sticky left-12 z-20 bg-surface-2 sticky-shadow border-b border-border min-w-[230px] px-3 py-2.5 font-medium"
              >
                Club
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                Pts
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                Sq
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                P
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right text-positive"
              >
                W
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                D
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right text-negative"
              >
                L
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                GF
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right"
              >
                GA
              </th>
              <th
                scope="col"
                className="bg-surface-2 border-b border-border px-3 py-2.5 font-medium text-right pr-4"
              >
                GD
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <ClubRow key={c.id} club={c} onOpen={() => onOpen(c.id)} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-12 text-center text-muted">
                  No clubs match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClubRow({ club, onOpen }: { club: Club; onOpen: () => void }) {
  const gd = club.goalsFor - club.goalsAgainst;
  const topThree = club.rank <= 3;
  const rowBg = topThree ? "bg-accent-soft/40" : "bg-surface";
  const stickyBg = rowBg;

  return (
    <tr
      onClick={onOpen}
      className={
        "cursor-pointer border-b border-border last:border-b-0 transition-colors " +
        rowBg +
        " hover:bg-surface-2"
      }
    >
      <td className={"sticky left-0 z-10 w-12 px-3 py-2.5 align-middle " + stickyBg}>
        <span className="font-mono text-sm text-ink tabular-nums">{club.rank}</span>
      </td>
      <td
        className={
          "sticky left-12 z-10 sticky-shadow min-w-[230px] px-3 py-2.5 align-middle " +
          stickyBg
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          <ClubBadge short={club.shortName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{club.name}</p>
            <p className="truncate text-[11px] text-muted">
              {club.manager} · {club.city}
            </p>
          </div>
          <RankDelta rank={club.rank} prev={club.prev} />
        </div>
      </td>
      <td className="px-3 py-2.5 text-right align-middle">
        <span className="font-mono text-base text-ink font-semibold tabular-nums">
          {club.points}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {club.playerIds.length}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {club.played}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-positive tabular-nums">
        {club.wins}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {club.draws}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-negative tabular-nums">
        {club.losses}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {club.goalsFor}
      </td>
      <td className="px-3 py-2.5 text-right align-middle font-mono text-ink-soft tabular-nums">
        {club.goalsAgainst}
      </td>
      <td
        className={
          "px-3 py-2.5 text-right align-middle font-mono tabular-nums pr-4 " +
          (gd > 0 ? "text-positive" : gd < 0 ? "text-negative" : "text-ink-soft")
        }
      >
        {gd > 0 ? `+${gd}` : gd}
      </td>
    </tr>
  );
}

function ClubBadge({ short }: { short: string }) {
  return (
    <span className="shrink-0 inline-grid place-items-center h-8 w-8 rounded border border-border bg-surface-2 font-mono text-[10px] font-bold tracking-wider text-ink-soft">
      {short}
    </span>
  );
}

function RankDelta({ rank, prev }: { rank: number; prev: number }) {
  const diff = prev - rank;
  if (diff === 0) {
    return (
      <span
        className="ml-auto inline-flex items-center justify-center w-5 text-muted-soft"
        aria-label="No change"
      >
        —
      </span>
    );
  }
  const up = diff > 0;
  return (
    <span
      className={
        "ml-auto inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums " +
        (up ? "text-positive" : "text-negative")
      }
      aria-label={up ? `Up ${Math.abs(diff)}` : `Down ${Math.abs(diff)}`}
    >
      <span aria-hidden>{up ? "▲" : "▼"}</span>
      {Math.abs(diff)}
    </span>
  );
}

function ClubDrawer({
  club,
  onClose,
}: {
  club: Club | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!club) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [club, onClose]);

  return (
    <div
      aria-hidden={!club}
      className={
        "fixed inset-0 z-[60] transition-opacity duration-200 " +
        (club ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")
      }
    >
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={
          "absolute right-0 top-0 h-full w-full sm:max-w-md bg-surface border-l border-border transition-transform duration-300 ease-out " +
          (club ? "translate-x-0" : "translate-x-full")
        }
      >
        {club && <DrawerBody club={club} onClose={onClose} />}
      </aside>
    </div>
  );
}

function DrawerBody({ club, onClose }: { club: Club; onClose: () => void }) {
  const total = club.wins + club.draws + club.losses;
  const winRate = total > 0 ? (club.wins / total) * 100 : 0;
  const gd = club.goalsFor - club.goalsAgainst;
  const roster = PLAYERS.filter((p) => club.playerIds.includes(p.id)).sort(
    (a, b) => a.rank - b.rank,
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 h-12 border-b border-border">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
          Club Profile
        </p>
        <button
          onClick={onClose}
          className="h-8 w-8 grid place-items-center rounded text-muted hover:text-ink hover:bg-surface-2 transition"
          aria-label="Close drawer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M6 6l12 12" />
            <path d="M18 6l-12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        <header>
          <div className="flex items-center gap-3">
            <ClubBadge short={club.shortName} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                Rank #{club.rank} · Founded {club.founded}
              </p>
              <p className="mt-0.5 text-xl font-semibold text-ink leading-tight">
                {club.name}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            {club.city} · Manager <span className="text-ink-soft">{club.manager}</span>
          </p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-3 border border-border rounded-md overflow-hidden divide-x divide-y divide-border bg-surface">
          <Stat label="Points" value={club.points.toString()} />
          <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} />
          <Stat label="Squad" value={club.playerIds.length.toString()} />
          <Stat
            label="Goal Diff"
            value={`${gd >= 0 ? "+" : ""}${gd}`}
            tone={gd > 0 ? "positive" : gd < 0 ? "negative" : "default"}
          />
          <Stat label="Played" value={club.played.toString()} />
          <Stat label="Wins" value={club.wins.toString()} tone="positive" />
        </section>

        <section>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted mb-2">
            Roster
          </p>
          {roster.length === 0 ? (
            <p className="text-sm text-muted">No registered players.</p>
          ) : (
            <ol className="rounded-md border border-border divide-y divide-border bg-surface">
              {roster.map((p) => (
                <li
                  key={p.id}
                  className="px-3 py-2 flex items-center gap-3 text-sm"
                >
                  <span className="w-6 text-right font-mono text-xs tabular-nums text-muted">
                    {p.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className="truncate text-[11px] text-muted">
                      <span className="font-mono">@{p.gamertag}</span> · {p.division}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-ink-soft">
                    {p.points.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
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
      ? "text-positive"
      : tone === "negative"
        ? "text-negative"
        : "text-ink";
  return (
    <div className="px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className={"mt-0.5 font-mono text-base tabular-nums " + cls}>{value}</p>
    </div>
  );
}
