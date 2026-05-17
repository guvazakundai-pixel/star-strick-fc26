"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useDraftStore } from "@/store/draft-store";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { leagueDraft, setLeagueDraft } = useDraftStore();

  const [name, setName] = useState(leagueDraft?.name || "");
  const [description, setDescription] = useState(leagueDraft?.description || "");
  const [type, setType] = useState<"PUBLIC" | "PRIVATE" | "FRIENDS" | "RANKED" | "REGIONAL">(leagueDraft?.type || "PUBLIC");
  const [maxPlayers, setMaxPlayers] = useState(leagueDraft?.maxPlayers || 20);
  const [rounds, setRounds] = useState(leagueDraft?.rounds || 2);
  const [homeAway, setHomeAway] = useState(leagueDraft?.homeAway !== false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setSubmitting(true);
    setError("");

    setLeagueDraft({ name: name.trim(), description, type, maxPlayers, rounds, homeAway });

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, type, maxPlayers, rounds, homeAway }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create"); setSubmitting(false); return; }
      router.push(`/leagues/${data.data.id}`);
    } catch {
      setError("Network error"); setSubmitting(false);
    }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Create</p>
          <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink mt-1">New League</h1>
          <p className="text-muted-soft text-sm mt-1">Set up your competition. Invite players. Start the season.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          {error && (
            <div className="rounded-[16px] border border-negative/25 px-4 py-3 text-sm text-negative/90" style={{ background: "rgba(255,51,51,0.06)" }}>
              {error}
            </div>
          )}

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">League Name</label>
            <input className="input-premium w-full" placeholder="e.g. Premier League ZW" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">Description</label>
            <textarea className="input-premium w-full resize-none h-24" placeholder="Describe your league..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">Type</label>
            <div className="flex gap-2">
              {(["PUBLIC", "PRIVATE", "FRIENDS"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`px-4 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all ${
                    type === t ? "bg-accent/15 border border-accent/30 text-accent" : "bg-bg-elevated/40 border border-border text-muted-soft hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">Max Players</label>
              <input type="number" className="input-premium w-full" min={2} max={100} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft block mb-1.5">Rounds</label>
              <input type="number" className="input-premium w-full" min={1} max={4} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={homeAway} onChange={(e) => setHomeAway(e.target.checked)}
              className="w-4 h-4 rounded-[4px] accent-accent" />
            <span className="text-sm text-ink">Home & Away fixtures (double round-robin)</span>
          </label>

          <div className="frosted-card p-5 rounded-[24px] mt-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-2">Preview</p>
            <p className="cinematic-heading text-2xl text-ink">{name || "Your League Name"}</p>
            <div className="flex gap-3 mt-3 text-[10px] text-muted-soft font-mono">
              <span className="pill-accent px-2 py-1 rounded-[6px]">{type}</span>
              <span>{maxPlayers} max players</span>
              <span>{rounds} round(s)</span>
              {homeAway && <span>H/A</span>}
            </div>
          </div>

          <button type="submit" disabled={submitting}
            className="btn-primary w-full h-13 text-sm rounded-[18px] mt-4">
            {submitting ? "Creating..." : "Create League"}
          </button>
        </motion.form>
      </div>
    </div>
  );
}
