"use client"

import { useEffect, useState } from "react"

type RankingEntry = {
  id: string
  userId: string
  rankPosition: number
  prevPosition: number | null
  points: number
  user: { username: string }
}

export default function ManagerRankingsPage() {
  const [club, setClub] = useState<{ id: string; name: string } | null>(null)
  const [rankings, setRankings] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          return fetch(`/api/clubs/${myClub.id}/rankings`)
            .then((r2) => r2.json())
            .then((d) => setRankings(d.rankings ?? []))
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!club) return
    setSaving(true)
    setError("")

    try {
      const res = await fetch(`/api/clubs/${club.id}/rankings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rankings.map((r, i) => ({
          userId: r.userId,
          rankPosition: i + 1,
          points: r.points,
        }))),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save")
        return
      }

      const data = await res.json()
      setRankings(data.rankings)
    } catch {
      setError("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const updatePoints = (idx: number, points: number) => {
    setRankings((prev) => prev.map((r, i) => i === idx ? { ...r, points } : r))
  }

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    setRankings((prev) => {
      const newRankings = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newRankings.length) return prev
      
      // Swap
      const temp = newRankings[index]
      newRankings[index] = newRankings[targetIndex]
      newRankings[targetIndex] = temp
      
      return newRankings
    })
  }

  if (loading) return <p className="text-white/40 p-8">Loading...</p>
  if (!club) return <p className="text-red-400 p-8">No club found.</p>

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="bc-headline text-3xl text-white">Rankings: {club.name}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] uppercase hover:bg-white transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Rankings"}
          </button>
        </div>

        {error && (
          <div className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>
        )}

        {rankings.length === 0 ? (
          <p className="text-white/40">No players to rank yet.</p>
        ) : (
          <div className="space-y-2">
            {rankings.map((r, i) => {
              const movement = r.prevPosition ? r.prevPosition - (i + 1) : 0
              return (
                <div key={r.id} className="flex items-center gap-4 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3">
                  <div className="w-8 text-center">
                    <span className="text-lg font-black text-white/30">#{i + 1}</span>
                    {movement > 0 && <span className="block text-xs text-[#00ff85]">▲ {movement}</span>}
                    {movement < 0 && <span className="block text-xs text-red-400">▼ {Math.abs(movement)}</span>}
                    {movement === 0 && r.prevPosition !== null && <span className="block text-xs text-white/30">—</span>}
                  </div>
                  <span className="flex-1 text-white font-bold">{r.user.username}</span>
                  
                  <div className="flex items-center gap-1">
                    <button onClick={() => movePlayer(i, 'up')} disabled={i === 0} className="p-1 rounded-sm hover:bg-white/10 disabled:opacity-20 transition">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-white">
                        <path d="M18 15l-6-6-6 6"/>
                      </svg>
                    </button>
                    <button onClick={() => movePlayer(i, 'down')} disabled={i === rankings.length - 1} className="p-1 rounded-sm hover:bg-white/10 disabled:opacity-20 transition">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-white">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                  </div>

                  <label className="text-xs text-white/40">Points</label>
                  <input
                    type="number"
                    min={0}
                    value={r.points}
                    onChange={(e) => updatePoints(i, parseInt(e.target.value) || 0)}
                    className="w-20 rounded-sm border border-[#1a1a1a] bg-[#111] px-2 py-1.5 text-sm text-white text-center focus:border-[#00ff85] focus:outline-none"
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
