"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface Player {
  id: string
  username: string
  avatarUrl?: string
  playerStats?: { wins: number; losses: number; skillRating: number }
  isOnline?: boolean
}

export default function FindMatchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<"search" | "select" | "confirm">("search")
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  async function handleSearch() {
    setLoading(true)
    try {
      const res = await fetch("/api/clubs")
      const data = await res.json()
      const allMembers: Player[] = []
      for (const club of data.clubs ?? []) {
        const memRes = await fetch(`/api/clubs/${club.id}/members`)
        const memData = await memRes.json()
        for (const m of memData.members ?? []) {
          if (m.user && m.user.id !== user?.id && m.status === "APPROVED") {
            allMembers.push({
              id: m.user.id,
              username: m.user.username,
              avatarUrl: m.user.avatarUrl,
              playerStats: m.user.playerStats,
              isOnline: false,
            })
          }
        }
      }
      const filtered = searchQuery
        ? allMembers.filter((p) => p.username.toLowerCase().includes(searchQuery.toLowerCase()))
        : allMembers
      setPlayers(filtered)
      setStep("select")
    } catch {
    } finally {
      setLoading(false)
    }
  }

  async function sendChallenge() {
    if (!selectedPlayer || !user) return
    setSending(true)
    try {
      const res = await fetch("/api/match-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedPlayer.id,
          message: message || undefined,
        }),
      })
      if (res.ok) {
        setStep("confirm")
      } else {
        const data = await res.json()
        alert(data.error ?? "Failed to send challenge")
      }
    } catch {
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-20">
        <button
          onClick={() => step === "select" ? setStep("search") : step === "confirm" ? setStep("select") : router.back()}
          className="text-white/50 text-sm mb-4 hover:text-white transition flex items-center gap-1"
        >
          ← Back
        </button>

        <AnimatePresence mode="wait">
          {step === "search" && (
            <motion.div key="search" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-black text-white mb-2">Find Opponent</h1>
              <p className="text-white/50 mb-8">Search for a player to challenge</p>

              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchQuery.length >= 2 && handleSearch()}
                  placeholder="Enter player name..."
                  className="w-full h-14 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 pl-12 text-lg text-white placeholder-white/20 focus:border-[#00ff85] focus:outline-none"
                  autoFocus
                />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              <button
                onClick={handleSearch}
                disabled={searchQuery.length < 2 || loading}
                className="w-full h-12 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "Searching..." : "SEARCH PLAYERS"}
              </button>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-white/50 mb-3">Quick Challenges</h3>
                <QuickChallengeCards />
              </div>
            </motion.div>
          )}

          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-black text-white mb-2">Select Opponent</h1>
              <p className="text-white/50 mb-6">{players.length} players found</p>

              <div className="space-y-2">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className={`w-full flex items-center gap-3 p-4 rounded-sm border transition text-left ${
                      selectedPlayer?.id === player.id
                        ? "border-[#00ff85] bg-[#00ff85]/5"
                        : "border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#1a1a1a]"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-sm bg-[#111] flex items-center justify-center text-sm font-bold text-[#00ff85]">
                      {player.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold">{player.username}</p>
                      {player.playerStats && (
                        <p className="text-xs text-white/40">
                          {player.playerStats.wins}W / {player.playerStats.losses}L · {Math.round(player.playerStats.skillRating)} rating
                        </p>
                      )}
                    </div>
                    {player.isOnline && (
                      <span className="h-2 w-2 rounded-full bg-[#00ff85]" />
                    )}
                  </button>
                ))}
              </div>

              {selectedPlayer && (
                <div className="mt-6 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
                  <label className="block text-xs text-white/50 mb-2">Message (optional)</label>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ready to play?"
                    maxLength={200}
                    className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00ff85]/50 mb-4"
                  />
                  <button
                    onClick={sendChallenge}
                    disabled={sending}
                    className="w-full h-12 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition disabled:opacity-50"
                  >
                    {sending ? "Sending..." : `CHALLENGE ${selectedPlayer.username.toUpperCase()}`}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === "confirm" && selectedPlayer && (
            <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="rounded-sm border border-[#00ff85]/30 bg-[#00ff85]/5 p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-[#00ff85]/10 flex items-center justify-center text-2xl font-black text-[#00ff85] mx-auto mb-4">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Challenge Sent!</h2>
                <p className="text-white/50">
                  Waiting for <span className="text-[#00ff85] font-bold">{selectedPlayer.username}</span> to respond
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => router.push("/matches/requests")}
                    className="flex-1 h-10 rounded-sm border border-[#1a1a1a] text-white/60 text-sm font-bold hover:text-white transition"
                  >
                    View Requests
                  </button>
                  <button
                    onClick={() => { setStep("search"); setSelectedPlayer(null); setSearchQuery("") }}
                    className="flex-1 h-10 rounded-sm bg-[#00ff85] text-[#050505] text-sm font-black tracking-[0.1em] hover:bg-white transition"
                  >
                    CHALLENGE ANOTHER
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function QuickChallengeCards() {
  const [suggested, setSuggested] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then(async (data) => {
        const allMembers: Player[] = []
        for (const club of data.clubs ?? []) {
          const memRes = await fetch(`/api/clubs/${club.id}/members`)
          const memData = await memRes.json()
          for (const m of memData.members ?? []) {
            if (m.user && m.status === "APPROVED") {
              allMembers.push({
                id: m.user.id,
                username: m.user.username,
                avatarUrl: m.user.avatarUrl,
                playerStats: m.user.playerStats,
              })
            }
          }
        }
        setSuggested(allMembers.slice(0, 4))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-white/30 text-sm">Finding players...</div>
  if (suggested.length === 0) return <div className="text-white/30 text-sm">No players available right now</div>

  return (
    <div className="grid grid-cols-2 gap-3">
      {suggested.slice(0, 4).map((player) => (
        <div key={player.id} className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4 text-center">
          <div className="h-10 w-10 rounded-full bg-[#111] flex items-center justify-center text-sm font-bold text-[#00ff85] mx-auto mb-2">
            {player.username.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-white font-bold text-sm">{player.username}</p>
          {player.playerStats && (
            <p className="text-xs text-white/40">{Math.round(player.playerStats.skillRating)} rating</p>
          )}
        </div>
      ))}
    </div>
  )
}
