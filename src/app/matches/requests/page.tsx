"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

interface MatchRequest {
  id: string
  sender: {
    id: string
    username: string
    avatarUrl?: string
    playerStats?: { wins: number; losses: number; skillRating: number }
  }
  receiver: {
    id: string
    username: string
    avatarUrl?: string
  }
  status: string
  message?: string
  expiresAt: string
  createdAt: string
}

export default function MatchRequestsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<MatchRequest[]>([])
  const [activeTab, setActiveTab] = useState<"incoming" | "sent">("incoming")
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [showScoreModal, setShowScoreModal] = useState<string | null>(null)
  const [scores, setScores] = useState({ myScore: "", theirScore: "" })
  const [submittingScore, setSubmittingScore] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchRequests()
  }, [user, activeTab])

  async function fetchRequests() {
    setLoading(true)
    try {
      const res = await fetch(`/api/match-requests?type=${activeTab === "incoming" ? "received" : "sent"}`)
      const data = await res.json()
      setRequests(data.requests ?? [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(requestId: string, action: "ACCEPT" | "DECLINE") {
    setProcessing(requestId)
    try {
      const res = await fetch(`/api/match-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        if (action === "ACCEPT") {
          setShowScoreModal(requestId)
        } else {
          setRequests((prev) => prev.filter((r) => r.id !== requestId))
        }
      }
    } catch {
    } finally {
      setProcessing(null)
    }
  }

  async function submitScore() {
    if (!showScoreModal) return
    setSubmittingScore(true)
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestIds: showScoreModal,
          score1: parseInt(scores.myScore) || 0,
          score2: parseInt(scores.theirScore) || 0,
        }),
      })
      if (res.ok) {
        setShowScoreModal(null)
        setScores({ myScore: "", theirScore: "" })
        setRequests((prev) => prev.filter((r) => r.id !== showScoreModal))
        router.push("/dashboard")
      }
    } catch {
    } finally {
      setSubmittingScore(false)
    }
  }

  const otherPlayer = (req: MatchRequest) =>
    activeTab === "incoming" ? req.sender : req.receiver

  return (
    <div className="broadcast-theme min-h-screen bc-noise pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-20">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">Match Requests</h1>
            <p className="text-white/50 text-sm mt-1">Challenges and responses</p>
          </div>
          <button
            onClick={() => router.push("/matches/find")}
            className="h-9 px-4 rounded-sm bg-[#00ff85] text-[#050505] text-xs font-black tracking-[0.1em] hover:bg-white transition"
          >
            + CHALLENGE
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("incoming")}
            className={`flex-1 h-10 rounded-sm text-sm font-bold transition ${
              activeTab === "incoming"
                ? "bg-[#00ff85]/10 text-[#00ff85]"
                : "bg-[#111] text-white/50 hover:text-white"
            }`}
          >
            Incoming
            {requests.filter((r) => r.status === "PENDING").length > 0 && activeTab === "incoming" && (
              <span className="ml-2 h-5 px-1.5 rounded-full bg-[#ffb800]/20 text-[#ffb800] text-xs">
                {requests.filter((r) => r.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 h-10 rounded-sm text-sm font-bold transition ${
              activeTab === "sent"
                ? "bg-[#00ff85]/10 text-[#00ff85]"
                : "bg-[#111] text-white/50 hover:text-white"
            }`}
          >
            Sent
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-white/40">Loading...</p></div>
        ) : requests.length === 0 ? (
          <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-12 text-center">
            <p className="text-white/40 text-lg mb-2">
              {activeTab === "incoming" ? "No incoming challenges" : "No sent requests"}
            </p>
            <p className="text-white/30 text-sm">
              {activeTab === "incoming"
                ? "When someone challenges you, it'll appear here"
                : "Challenge a player to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {requests.map((req) => {
                const player = otherPlayer(req)
                const stats = player.playerStats
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-[#111] flex items-center justify-center text-sm font-bold text-[#00ff85]">
                        {player.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold">{player.username}</p>
                        {stats && (
                          <p className="text-xs text-white/40">
                            {stats.wins}W / {stats.losses}L · Rating: {Math.round(stats.skillRating)}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-xs text-white/30 mt-1 italic">"{req.message}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
                      <span className={`text-xs font-bold ${
                        req.status === "PENDING" ? "text-[#ffb800]" :
                        req.status === "ACCEPTED" ? "text-[#00ff85]" : "text-red-400"
                      }`}>
                        {req.status === "PENDING" ? "⏳ Pending" :
                         req.status === "ACCEPTED" ? "✓ Accepted" : "✕ Declined"}
                      </span>

                      {activeTab === "incoming" && req.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(req.id, "DECLINE")}
                            disabled={processing === req.id}
                            className="h-7 px-3 rounded-sm bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => handleAction(req.id, "ACCEPT")}
                            disabled={processing === req.id}
                            className="h-7 px-3 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-xs font-bold hover:bg-[#00ff85]/20 transition disabled:opacity-50"
                          >
                            {processing === req.id ? "..." : "Accept"}
                          </button>
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

      {showScoreModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Report Score</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-white/50 mb-1">Your Score</label>
                <input
                  type="number"
                  min="0"
                  value={scores.myScore}
                  onChange={(e) => setScores((prev) => ({ ...prev, myScore: e.target.value }))}
                  className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-center text-2xl font-black text-[#00ff85] focus:outline-none focus:border-[#00ff85]/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Opponent Score</label>
                <input
                  type="number"
                  min="0"
                  value={scores.theirScore}
                  onChange={(e) => setScores((prev) => ({ ...prev, theirScore: e.target.value }))}
                  className="w-full h-12 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-center text-2xl font-black text-white focus:outline-none focus:border-[#00ff85]/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowScoreModal(null); setScores({ myScore: "", theirScore: "" }) }}
                className="flex-1 h-10 rounded-sm border border-[#1a1a1a] text-white/60 text-sm font-bold hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={submitScore}
                disabled={submittingScore || scores.myScore === "" || scores.theirScore === ""}
                className="flex-1 h-10 rounded-sm bg-[#00ff85] text-[#050505] text-sm font-black tracking-[0.1em] hover:bg-white transition disabled:opacity-50"
              >
                {submittingScore ? "Submitting..." : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
