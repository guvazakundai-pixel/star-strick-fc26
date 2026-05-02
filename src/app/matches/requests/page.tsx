"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface Match {
  id: string
  player1: { id: string; username: string }
  player2: { id: string; username: string }
  winner?: { id: string; username: string }
  score1: number
  score2: number
  status: string
  confirmations: Record<string, string> | null
  notes?: string
  createdAt: string
}

export default function MatchRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchMatches()
  }, [user, activeTab])

  async function fetchMatches() {
    setLoading(true)
    try {
      const status = activeTab === "active" ? "" : "APPROVED"
      const res = await fetch(`/api/matches?playerId=${user.id}${status ? `&status=${status}` : ""}`)
      const data = await res.json()
      const filtered = activeTab === "active"
        ? (data.matches ?? []).filter((m: Match) => m.status !== "APPROVED")
        : data.matches ?? []
      setMatches(filtered)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function confirmWinner(matchId: string, winnerId: string) {
    setProcessing(matchId)
    setMessage("")
    try {
      const res = await fetch(`/api/matches?id=${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId }),
      })
      const data = await res.json()

      if (data.autoApproved) {
        setMessage("✓ Both players agreed! Result applied.")
        setMatches((prev) => prev.filter((m) => m.id !== matchId))
      } else if (data.flagged) {
        setMessage("⚠ Results disagree. Flagged for review.")
        setMatches((prev) => prev.filter((m) => m.id !== matchId))
      } else if (data.pending) {
        setMessage("⏳ Waiting for opponent to confirm.")
        setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: "ACCEPTED" } : m)))
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setProcessing(null)
    }
  }

  const opponent = (m: Match) =>
    m.player1.id === user?.id ? m.player2 : m.player1

  const hasConfirmed = (m: Match) =>
    m.confirmations && user ? m.confirmations[user.id] : false

  const suggestedWinner = (m: Match) =>
    m.score1 > m.score2 ? m.player1.id : m.score2 > m.score1 ? m.player2.id : null

  return (
    <div className="broadcast-theme min-h-screen bc-noise pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Matches</h1>
            <p className="text-white/50 text-sm mt-1">Confirm results and track history</p>
          </div>
          <button
            onClick={() => router.push("/matches/find")}
            className="h-9 px-4 rounded-sm bg-[#00ff85] text-[#050505] text-xs font-black tracking-[0.1em] hover:bg-white transition"
          >
            + PLAY
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 h-10 rounded-sm text-sm font-bold transition ${
              activeTab === "active"
                ? "bg-[#00ff85]/10 text-[#00ff85]"
                : "bg-[#111] text-white/50 hover:text-white"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 h-10 rounded-sm text-sm font-bold transition ${
              activeTab === "history"
                ? "bg-[#00ff85]/10 text-[#00ff85]"
                : "bg-[#111] text-white/50 hover:text-white"
            }`}
          >
            History
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-sm text-sm font-bold ${
            message.startsWith("✓") ? "bg-[#00ff85]/10 text-[#00ff85]" :
            message.startsWith("⚠") ? "bg-[#ffb800]/10 text-[#ffb800]" :
            "bg-white/5 text-white/60"
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><p className="text-white/40">Loading...</p></div>
        ) : matches.length === 0 ? (
          <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-12 text-center">
            <p className="text-white/40 text-lg mb-2">
              {activeTab === "active" ? "No active matches" : "No match history"}
            </p>
            <button
              onClick={() => router.push("/matches/find")}
              className="mt-3 text-[#00ff85] text-sm font-bold hover:underline"
            >
              Find an opponent →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {matches.map((m) => {
                const opp = opponent(m)
                const winner = suggestedWinner(m)
                const confirmed = hasConfirmed(m)
                const isDraw = m.score1 === m.score2

                return (
                  <motion.div
                    key={m.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-sm bg-[#111] flex items-center justify-center text-xs font-bold text-[#00ff85]">
                            {opp.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">vs {opp.username}</p>
                            <p className="text-xs text-white/30">{new Date(m.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <StatusBadge status={m.status} confirmed={!!confirmed} />
                      </div>

                      <div className="flex items-center justify-center gap-6 py-3 bg-[#111] rounded-sm">
                        <div className="text-center">
                          <p className="text-xs text-white/40 mb-1">{user?.username}</p>
                          <p className="text-3xl font-black text-[#00ff85]">{m.score1}</p>
                        </div>
                        <span className="text-white/20 text-xl font-bold">—</span>
                        <div className="text-center">
                          <p className="text-xs text-white/40 mb-1">{opp.username}</p>
                          <p className="text-3xl font-black text-white">{m.score2}</p>
                        </div>
                      </div>

                      {!m.winner && m.status !== "APPROVED" && (
                        <div className="mt-4">
                          {confirmed ? (
                            <div className="text-center py-2">
                              <p className="text-sm text-[#ffb800] font-bold">⏳ Waiting for opponent...</p>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => confirmWinner(m.id, winner || "")}
                                disabled={processing === m.id || isDraw}
                                className="flex-1 h-10 rounded-sm bg-[#00ff85] text-[#050505] text-sm font-black tracking-[0.1em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {processing === m.id ? "..." : isDraw ? "Confirm Draw" : "Confirm Result"}
                              </button>
                              {!isDraw && winner && (
                                <button
                                  onClick={() => confirmWinner(m.id, winner === m.player1.id ? m.player2.id : m.player1.id)}
                                  disabled={processing === m.id}
                                  className="h-10 px-4 rounded-sm border border-[#1a1a1a] text-white/40 text-xs font-bold hover:text-white transition disabled:opacity-30"
                                >
                                  Dispute
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status, confirmed }: { status: string; confirmed: boolean }) {
  if (confirmed) return <span className="px-2 py-0.5 rounded-sm bg-[#ffb800]/10 text-[#ffb800] text-[10px] font-bold">Confirmed</span>
  if (status === "FLAGGED") return <span className="px-2 py-0.5 rounded-sm bg-red-500/10 text-red-400 text-[10px] font-bold">Flagged</span>
  if (status === "APPROVED") return <span className="px-2 py-0.5 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-[10px] font-bold">Done</span>
  return <span className="px-2 py-0.5 rounded-sm bg-white/5 text-white/40 text-[10px] font-bold">Pending</span>
}
