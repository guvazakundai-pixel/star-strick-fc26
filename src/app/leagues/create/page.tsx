"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function CreateLeaguePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("PUBLIC")
  const [maxPlayers, setMaxPlayers] = useState(16)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) { setError("League name is required"); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, type, maxPlayers }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to create"); return }
      router.push(`/leagues/${data.league.id}`)
    } catch { setError("Something went wrong") }
    finally { setLoading(false) }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-grain pb-28">
      <div className="mx-auto max-w-lg px-4 pt-8">
        <button onClick={() => router.back()} className="text-xs text-muted-soft hover:text-ink mb-4 flex items-center gap-1">
          ← Back
        </button>

        <h1 className="bc-headline text-3xl text-ink">Create League</h1>
        <p className="text-sm text-muted mt-1">Set up a new football-style competition</p>

        <div className="flex gap-2 mt-6 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all" style={{
              background: s <= step ? "var(--accent)" : "rgba(255,255,255,0.06)",
            }} />
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">League Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premier Division"
                className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Description (optional)</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this league about?"
                rows={3} className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none resize-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-[14px] text-sm font-bold text-black transition-all"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}>
              Continue
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">League Type</label>
              <div className="grid gap-2 mt-1.5">
                {[
                  { value: "PUBLIC", label: "🌍 Public", desc: "Anyone can find and join" },
                  { value: "PRIVATE", label: "🔒 Private", desc: "Invite code only" },
                  { value: "FRIENDS", label: "👥 Friends", desc: "Friend invites only" },
                ].map((opt) => (
                  <button key={opt.value} onClick={() => setType(opt.value)}
                    className={`flex items-center gap-3 p-3.5 rounded-[14px] text-left transition-all ${
                      type === opt.value ? "text-ink" : "text-muted-soft"
                    }`}
                    style={{
                      border: `1px solid ${type === opt.value ? "rgba(0,255,133,0.15)" : "rgba(255,255,255,0.04)"}`,
                      background: type === opt.value ? "rgba(0,255,133,0.04)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-[11px] text-muted-faint">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft"
                style={{ background: "rgba(255,255,255,0.04)" }}>Back</button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black"
                style={{ background: "var(--accent)" }}>Continue</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Max Players</label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {[4, 8, 16, 32].map((n) => (
                  <button key={n} onClick={() => setMaxPlayers(n)}
                    className={`py-3 rounded-[14px] text-sm font-bold transition-all ${
                      maxPlayers === n ? "text-black" : "text-muted-soft"
                    }`}
                    style={{
                      background: maxPlayers === n ? "var(--accent)" : "rgba(255,255,255,0.04)",
                      boxShadow: maxPlayers === n ? "0 2px 12px rgba(0,255,133,0.2)" : "none",
                    }}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] p-4 space-y-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-xs font-bold text-ink">Summary</p>
              <div className="text-[11px] text-muted-soft space-y-1 font-mono">
                <p>Name: {name || "—"}</p>
                <p>Type: {type}</p>
                <p>Max Players: {maxPlayers}</p>
              </div>
            </div>

            {error && <p className="text-xs text-red bg-red/10 rounded-xl px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft"
                style={{ background: "rgba(255,255,255,0.04)" }}>Back</button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}>
                {loading ? "Creating..." : "Create League"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
