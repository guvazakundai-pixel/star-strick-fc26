"use client";

import { useState, useTransition } from "react";

const TOURNAMENT_TYPES = [
  { value: "KNOCKOUT", label: "Single Elimination" },
  { value: "ROUND_ROBIN", label: "Round Robin" },
];

const CITIES = ["All", "Harare", "Bulawayo", "Mutare", "Gweru", "Kwekwe", "Masvingo", "Chitungwiza", "Victoria Falls"];
const PLATFORMS = ["CROSSPLAY", "PS5", "XBOX", "PC"];

const CREATOR_FEE_USD = 5;

export function TournamentCreateForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("KNOCKOUT");
  const [city, setCity] = useState("All");
  const [platform, setPlatform] = useState("CROSSPLAY");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const [entryFee, setEntryFee] = useState(0);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/tournaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        type,
        city: city === "All" ? null : city,
        platform,
        maxPlayers,
        entryFee: entryFee * 100,
        description,
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed to create tournament");
      return;
    }
    startTransition(onDone);
  }

  const totalCost = CREATOR_FEE_USD + entryFee;

  return (
    <div className="frosted-card p-5 sm:p-6 rounded-[24px] mb-6 border border-accent/20">
      <h3 className="cinematic-heading text-xl text-ink mb-4">Create Tournament</h3>
      <form onSubmit={onSubmit} className="space-y-3.5">
        {error && (
          <div className="rounded-[12px] border border-negative/25 px-3 py-2.5 text-sm text-negative/90 bg-negative/6">
            {error}
          </div>
        )}

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={60}
            placeholder="e.g. Harare Cup S1"
            className="w-full apple-input px-3 py-2.5 text-ink text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
              {TOURNAMENT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">City</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
              {CITIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Platform</span>
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
              {PLATFORMS.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Max Players</span>
            <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} className="w-full apple-input px-3 py-2.5 text-ink text-sm cursor-pointer">
              {[4, 8, 16, 32, 64].map((n) => (<option key={n} value={n}>{n}</option>))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Entry Fee (USD) — per player</span>
          <input
            type="number"
            min={0}
            max={20}
            step={0.5}
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            className="w-full apple-input px-3 py-2.5 text-ink text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-xs uppercase tracking-wider text-muted-soft mb-1.5">Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Rules, format, prizes..."
            className="w-full apple-input px-3 py-2.5 text-ink text-sm resize-none"
          />
        </label>

        <div className="rounded-[12px] bg-bg-highlight/40 border border-border-faint px-3 py-2.5">
          <p className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-faint mb-1">Creator Fee</p>
          <p className="text-sm text-ink">
            ${CREATOR_FEE_USD}.00 USD <span className="text-muted-soft">— paid once to host this tournament</span>
          </p>
          {entryFee > 0 && (
            <p className="text-[10px] text-muted-soft mt-1">
              + ${entryFee.toFixed(2)} entry × {maxPlayers} max = ${(entryFee * maxPlayers).toFixed(2)} total prize pool
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={pending} className="flex-1 h-11 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 hover:border-accent/30 active:scale-95 transition-all duration-200 disabled:opacity-50">
            {pending ? "Creating..." : `Create — $${CREATOR_FEE_USD}.00`}
          </button>
          <button type="button" onClick={onCancel} className="h-11 px-5 rounded-[14px] font-bold text-[11px] tracking-[0.18em] uppercase text-muted-soft hover:text-ink border border-border-faint hover:border-border-strong transition-all duration-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
