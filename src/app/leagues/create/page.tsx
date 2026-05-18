"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Format = "ROUND_ROBIN" | "DOUBLE_ROUND_ROBIN" | "KNOCKOUT" | "GROUP_KNOCKOUT" | "SWISS";
type Visibility = "PUBLIC" | "PRIVATE" | "INVITE_ONLY";

const FORMATS: { id: Format; label: string; desc: string }[] = [
  { id: "ROUND_ROBIN", label: "Single Round Robin", desc: "Everyone plays each other once" },
  { id: "DOUBLE_ROUND_ROBIN", label: "Double Round Robin", desc: "Home & away — everyone plays twice" },
  { id: "GROUP_KNOCKOUT", label: "Group Stage + Knockout", desc: "Groups → Quarter/Semi/Final" },
  { id: "KNOCKOUT", label: "Straight Knockout", desc: "Single elimination bracket" },
  { id: "SWISS", label: "Swiss System", desc: "Paired by record each round" },
];

const VISIBILITY: { id: Visibility; label: string; icon: string }[] = [
  { id: "PUBLIC", label: "Public", icon: "🌍" },
  { id: "PRIVATE", label: "Private", icon: "🔒" },
  { id: "INVITE_ONLY", label: "Invite Only", icon: "📨" },
];

export default function CreateLeaguePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Format>("DOUBLE_ROUND_ROBIN");
  const [visibility, setVisibility] = useState<Visibility>("PUBLIC");
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [rounds, setRounds] = useState(2);
  const [homeAway, setHomeAway] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("League name is required"); return; }
    setSubmitting(true); setError("");

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), description, type: visibility,
          maxPlayers, rounds, homeAway, format,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create"); setSubmitting(false); return; }
      router.push(`/leagues/${data.data.id}`);
    } catch {
      setError("Network error"); setSubmitting(false);
    }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 250px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }} />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple">Competition</p>
          <h1 className="cinematic-heading text-3xl sm:text-5xl text-ink mt-1.5">
            Create <span className="text-gradient-pink">League</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Set up your competition. Choose format. Start the season.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-28">
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= s ? "bg-accent text-black" : "bg-white/5 text-muted-soft"
              }`}>{s}</div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                step >= s ? "text-ink" : "text-muted-faint"
              }`}>{s === 1 ? "Basics" : s === 2 ? "Format" : "Review"}</span>
              {s < 3 && <div className={`w-8 h-px ${step > s ? "bg-accent" : "bg-white/10"}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-[16px] border border-negative/25 px-4 py-3 text-sm text-negative/90 mb-4" style={{ background: "rgba(255,51,51,0.06)" }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="glass rounded-[24px] p-6 space-y-5">
              <h2 className="text-sm font-bold text-ink">Basic Information</h2>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft block mb-1.5">League Name</label>
                <input className="w-full px-4 py-3 rounded-[14px] text-sm text-ink outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} placeholder="e.g. Zim Champions League" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft block mb-1.5">Description</label>
                <textarea className="w-full px-4 py-3 rounded-[14px] text-sm text-ink outline-none resize-none" rows={3} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} placeholder="Describe your league..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>

            <div className="glass rounded-[24px] p-6">
              <h2 className="text-sm font-bold text-ink mb-3">Visibility</h2>
              <div className="flex gap-3">
                {VISIBILITY.map(v => (
                  <button key={v.id} type="button" onClick={() => setVisibility(v.id)}
                    className={`flex-1 p-4 rounded-[16px] text-center transition-all ${
                      visibility === v.id ? "border border-accent/30 bg-accent/10" : "border border-white/5 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-lg">{v.icon}</span>
                    <p className="text-xs font-bold text-ink mt-1">{v.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="glass rounded-[24px] p-6">
              <h2 className="text-sm font-bold text-ink mb-3">Tournament Format</h2>
              <div className="space-y-2">
                {FORMATS.map(f => (
                  <button key={f.id} type="button" onClick={() => { setFormat(f.id); setHomeAway(f.id === "DOUBLE_ROUND_ROBIN"); setRounds(f.id === "DOUBLE_ROUND_ROBIN" ? 2 : f.id === "ROUND_ROBIN" ? 1 : 1); }}
                    className={`w-full p-4 rounded-[16px] text-left transition-all ${
                      format === f.id ? "border border-accent/30 bg-accent/10" : "border border-white/5 bg-white/3 hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-bold text-ink">{f.label}</p>
                    <p className="text-xs text-muted-soft mt-0.5">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-[24px] p-6">
              <h2 className="text-sm font-bold text-ink mb-3">League Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft block mb-1">Max Players</label>
                  <input type="number" min={2} max={100} value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-[14px] text-sm text-ink outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft block mb-1">Rounds</label>
                  <input type="number" min={1} max={4} value={rounds} onChange={(e) => setRounds(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-[14px] text-sm text-ink outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
                </div>
              </div>
              {(format === "ROUND_ROBIN" || format === "DOUBLE_ROUND_ROBIN") && (
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <input type="checkbox" checked={homeAway} onChange={(e) => setHomeAway(e.target.checked)} className="w-4 h-4 rounded accent-accent" />
                  <span className="text-sm text-ink">Home & Away fixtures</span>
                </label>
              )}
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="glass rounded-[24px] p-6">
              <h2 className="text-sm font-bold text-ink mb-3">Review</h2>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-border-faint text-sm">
                  <span className="text-muted-soft">Name</span>
                  <span className="text-ink font-bold">{name || "Not set"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-faint text-sm">
                  <span className="text-muted-soft">Format</span>
                  <span className="text-ink font-bold">{FORMATS.find(f => f.id === format)?.label}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-faint text-sm">
                  <span className="text-muted-soft">Visibility</span>
                  <span className="text-ink font-bold">{visibility}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-faint text-sm">
                  <span className="text-muted-soft">Max Players</span>
                  <span className="text-ink font-bold">{maxPlayers}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-faint text-sm">
                  <span className="text-muted-soft">Rounds</span>
                  <span className="text-ink font-bold">{rounds}</span>
                </div>
                {homeAway && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-muted-soft">Home & Away</span>
                    <span className="text-accent font-bold">Yes</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-[16px] text-sm font-bold text-muted-soft bg-white/5 hover:bg-white/10 transition-all">
              Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} disabled={step === 1 && !name.trim()}
              className="flex-1 py-3 rounded-[16px] text-sm font-bold text-black disabled:opacity-40 transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
            >Continue</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-3 rounded-[16px] text-sm font-bold text-black disabled:opacity-40 transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
            >{submitting ? "Creating..." : "Launch League"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
