"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder, useDragControls, motion, AnimatePresence } from "framer-motion";

type Row = {
  id: string;
  userId: string;
  rankPosition: number;
  points: number;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    stats: { wins: number; losses: number; winStreak: number } | null;
  };
};

export function RankingsClient({ clubId, initial }: { clubId: string; initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [serverRows, setServerRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = useMemo(() => {
    if (rows.length !== serverRows.length) return true;
    return rows.some((r, i) => r.id !== serverRows[i].id || r.points !== serverRows[i].points);
  }, [rows, serverRows]);

  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 2400);
    return () => clearTimeout(t);
  }, [savedAt]);

  function setPoints(userId: string, points: number) {
    setRows((rs) => rs.map((r) => (r.userId === userId ? { ...r, points } : r)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const order = rows.map((r) => ({ userId: r.userId, points: r.points }));
    const res = await fetch(`/api/clubs/${clubId}/rankings/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Save failed");
      return;
    }
    const next = rows.map((r, i) => ({ ...r, rankPosition: i + 1 }));
    setRows(next);
    setServerRows(next);
    setSavedAt(Date.now());
  }

  function reset() {
    setRows(serverRows);
    setError(null);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--bc-border)] px-4 py-12 text-center text-sm text-[var(--bc-text-soft)]">
        No approved members yet. Approve players in the Members tab to start ranking them.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--bc-text-soft)]">
          {dirty ? (
            <span className="text-[var(--bc-accent)]">Unsaved changes</span>
          ) : savedAt ? (
            <span className="text-[var(--bc-accent)]">Saved.</span>
          ) : (
            "All changes synced."
          )}
        </p>
        <div className="flex gap-2">
          <button
            disabled={!dirty || saving}
            onClick={reset}
            className="rounded border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/80 disabled:opacity-30"
          >
            Reset
          </button>
          <button
            disabled={!dirty || saving}
            onClick={save}
            className="rounded bg-[var(--bc-accent)] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <Reorder.Group
        axis="y"
        values={rows}
        onReorder={setRows}
        className="space-y-2"
      >
        <AnimatePresence initial={false}>
          {rows.map((r, i) => (
            <RankingRow
              key={r.id}
              index={i}
              row={r}
              onPointsChange={(p) => setPoints(r.userId, p)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </div>
  );
}

function RankingRow({
  row,
  index,
  onPointsChange,
}: {
  row: Row;
  index: number;
  onPointsChange: (n: number) => void;
}) {
  const controls = useDragControls();
  const u = row.user;
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 600, damping: 38 }}
      className="select-none"
    >
      <motion.div
        layout
        className="grid grid-cols-[44px_36px_1fr_auto_auto] items-center gap-3 rounded-lg border border-[var(--bc-border)] bg-[var(--bc-surface)]/60 px-3 py-2.5 hover:border-[var(--bc-accent)]/40"
      >
        <button
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-[var(--bc-text-soft)] hover:bg-white/5 active:cursor-grabbing"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <span className="bc-headline text-2xl text-white tabular-nums">{index + 1}</span>
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-9 w-9 rounded-full border border-[var(--bc-border)] bg-cover bg-center bg-black"
            style={{ backgroundImage: u.avatarUrl ? `url(${u.avatarUrl})` : undefined }}
          />
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{u.displayName ?? u.username}</p>
            <p className="font-mono text-[11px] text-[var(--bc-text-soft)] truncate">
              @{u.username}
              {u.stats && (
                <>
                  {" · "}
                  {u.stats.wins}W-{u.stats.losses}L · streak {u.stats.winStreak}
                </>
              )}
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--bc-text-soft)]">
            Pts
          </span>
          <input
            type="number"
            min={0}
            value={row.points}
            onChange={(e) => onPointsChange(Number(e.target.value) || 0)}
            className="w-20 rounded border border-[var(--bc-border)] bg-black/40 px-2 py-1 text-right tabular-nums text-white outline-none focus:border-[var(--bc-accent)]"
          />
        </label>
        <span className="hidden md:inline font-mono text-[10px] text-[var(--bc-text-soft)]">
          rank #{row.rankPosition}
        </span>
      </motion.div>
    </Reorder.Item>
  );
}
