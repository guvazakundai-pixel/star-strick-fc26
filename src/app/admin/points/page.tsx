"use client";

import { useState, useTransition } from "react";

export default function AdminPointsPage() {
  const [userId, setUserId] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          points: parseInt(points, 10),
          reason,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`Awarded ${data.event.points} points to ${data.event.user?.username ?? userId}`);
        setPoints("");
        setReason("");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to award points");
      }
    });
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Points Management
        </p>
        <h1 className="bc-headline text-3xl text-white">Award Points</h1>
      </header>

      {success && (
        <div className="rounded border border-[#00ff85]/40 bg-[#00ff85]/10 px-4 py-3 text-sm text-[#00ff85]">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4 max-w-md">
        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            User ID or Username
          </span>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="e.g. player123 or uuid"
            className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm placeholder:text-[#666]"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            Points (positive or negative)
          </span>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            placeholder="e.g. 100 or -50"
            className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm placeholder:text-[#666]"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-[var(--bc-text-soft)] mb-1">
            Reason
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="e.g. Tournament win bonus"
            className="w-full rounded border border-[#333] bg-black/40 px-3 py-2.5 text-white outline-none focus:border-[#00ff85] text-sm placeholder:text-[#666]"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-[#00ff85] px-5 py-2.5 font-bold uppercase tracking-wider text-[#050505] hover:bg-white transition disabled:opacity-50 text-sm"
        >
          {loading ? "Awarding…" : "Award Points"}
        </button>
      </form>

      <div className="rounded-xl border border-[var(--bc-border)] bg-[var(--bc-surface)]/50 p-4 text-sm text-[var(--bc-text-soft)] space-y-2">
        <p className="font-bold text-white">How points work:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Enter a user ID or username to identify the player</li>
          <li>Use positive values to add points, negative to deduct</li>
          <li>All point awards are logged in the audit trail</li>
          <li>Player rankings update automatically when points change</li>
        </ul>
      </div>
    </div>
  );
}