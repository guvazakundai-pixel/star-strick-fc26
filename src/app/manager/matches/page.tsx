"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

interface Member {
  id: string
  userId: string
  user: { id: string; username: string }
}

export default function MatchReportingPage() {
  const { user } = useAuth()
  const [club, setClub] = useState<Record<string, unknown> | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [matches, setMatches] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    player1Id: "",
    player2Id: "",
    score1: "",
    score2: "",
    notes: "",
  })
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          return fetch(`/api/clubs/${myClub.id}/members`).then((r) => r.json())
        }
        return { members: [] }
      })
      .then((data) => {
        setMembers((data.members ?? []).filter((m: Member) => m.status === "APPROVED"))
        if (club) {
          return fetch(`/api/matches?clubId=${club.id}`).then((r) => r.json())
        }
        return { matches: [] }
      })
      .then((data) => {
        setMatches(data.matches ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club || !formData.player1Id || !formData.player2Id) {
      setError("Please select both players")
      return
    }
    if (formData.player1Id === formData.player2Id) {
      setError("Players must be different")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess("")

    const score1 = parseInt(formData.score1) || 0
    const score2 = parseInt(formData.score2) || 0
    const winnerId = score1 > score2 ? formData.player1Id : score2 > score1 ? formData.player2Id : null

    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clubId: club.id,
        player1Id: formData.player1Id,
        player2Id: formData.player2Id,
        score1,
        score2,
        winnerId,
        notes: formData.notes,
        submittedById: user?.id,
      }),
    })

    setSubmitting(false)

    if (res.ok) {
      setSuccess("Match reported successfully!")
      setFormData({ player1Id: "", player2Id: "", score1: "", score2: "", notes: "" })
      const data = await fetch(`/api/matches?clubId=${club.id}`).then((r) => r.json())
      setMatches(data.matches ?? [])
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to report match")
    }
  }

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>
  }

  if (!club) {
    return (
      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
        <p className="text-white/40">You must be a club manager to report matches.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Match Reporting</h1>
        <p className="text-white/50 mt-1">Report match results for {club.name as string}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">New Match</h2>

          <div>
            <label className="block text-xs text-white/50 mb-1">Player 1</label>
            <select
              value={formData.player1Id}
              onChange={(e) => setFormData((prev) => ({ ...prev, player1Id: e.target.value }))}
              className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-sm text-white focus:outline-none focus:border-[#00ff85]/50"
            >
              <option value="">Select player...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Player 2</label>
            <select
              value={formData.player2Id}
              onChange={(e) => setFormData((prev) => ({ ...prev, player2Id: e.target.value }))}
              className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-sm text-white focus:outline-none focus:border-[#00ff85]/50"
            >
              <option value="">Select player...</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.user.username}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Score - Player 1</label>
              <input
                type="number"
                min="0"
                value={formData.score1}
                onChange={(e) => setFormData((prev) => ({ ...prev, score1: e.target.value }))}
                className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-sm text-white focus:outline-none focus:border-[#00ff85]/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Score - Player 2</label>
              <input
                type="number"
                min="0"
                value={formData.score2}
                onChange={(e) => setFormData((prev) => ({ ...prev, score2: e.target.value }))}
                className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-sm text-white focus:outline-none focus:border-[#00ff85]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">Notes (optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff85]/50 resize-none"
            />
          </div>

          {error && <p className="text-sm text-[#ff0040]">{error}</p>}
          {success && <p className="text-sm text-[#00ff85]">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 rounded-sm bg-[#00ff85] text-[#050505] text-sm font-black tracking-[0.15em] hover:bg-white transition disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Report Match"}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">Recent Matches</h2>
          {matches.length === 0 ? (
            <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
              <p className="text-white/40">No matches reported yet</p>
            </div>
          ) : (
            matches.slice(0, 10).map((match) => (
              <div key={match.id as string} className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{match.player1?.username as string}</span>
                      <span className="text-[#00ff85] font-black text-lg">{match.score1 as number} - {match.score2 as number}</span>
                      <span className="text-white font-bold">{match.player2?.username as string}</span>
                    </div>
                    {match.notes && <p className="text-xs text-white/30 mt-1">{match.notes as string}</p>}
                  </div>
                  <div className="text-right">
                    {match.isDisputed && <span className="px-2 py-0.5 rounded-sm bg-[#ffb800]/10 text-[#ffb800] text-xs font-bold">Disputed</span>}
                    <p className="text-xs text-white/30 mt-1">{new Date(match.createdAt as string).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
