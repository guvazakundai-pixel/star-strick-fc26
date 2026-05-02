"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"

interface Club {
  id: string
  name: string
  city: string
  memberCount: number
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [clubs, setClubs] = useState<Club[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const clubsData = (data.clubs ?? []).map((c: Record<string, unknown> & { _count?: { members: number } }) => ({
          id: c.id as string,
          name: c.name as string,
          city: c.city as string,
          memberCount: c._count?.members ?? 0,
        }))
        setClubs(clubsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  const filteredClubs = clubs.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleJoinClub() {
    if (!selectedClub || !user) return
    setJoining(true)
    setMessage("")

    try {
      const res = await fetch(`/api/clubs/${selectedClub}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (res.ok) {
        setMessage("Join request sent!")
        setTimeout(() => setStep(3), 1000)
      } else {
        const data = await res.json()
        setMessage(data.error ?? "Failed to join")
      }
    } catch {
      setMessage("Something went wrong")
    } finally {
      setJoining(false)
    }
  }

  async function handleSkipClub() {
    setStep(3)
  }

  async function handleComplete() {
    if (!user) return
    try {
      await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      await refreshUser()
      router.push("/dashboard")
    } catch {
      router.push("/dashboard")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>
  }

  if (!user) return null

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-[0.1em]">WELCOME, {user.username.toUpperCase()}</h1>
          <p className="text-[#00ff85] text-sm font-bold mt-2">3 steps to get started</p>
        </div>

        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${s <= step ? "bg-[#00ff85]" : "bg-[#1a1a1a]"}`} />
              <p className={`text-xs mt-2 text-center font-bold ${s <= step ? "text-white/60" : "text-white/20"}`}>
                {s === 1 ? "Profile" : s === 2 ? "Club" : "Ready"}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-4">Your Profile</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-sm border border-[#1a1a1a] bg-[#111]">
                    <div className="h-12 w-12 rounded-full bg-[#00ff85]/10 flex items-center justify-center text-xl font-black text-[#00ff85]">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold">{user.username}</p>
                      <p className="text-xs text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-sm border border-[#ffb800]/20 bg-[#ffb800]/5">
                    <p className="text-sm text-[#ffb800] font-bold">You are currently UNRANKED</p>
                    <p className="text-xs text-white/40 mt-1">Play your first match to get placed on the leaderboard.</p>
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full h-12 mt-6 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition"
                >
                  NEXT →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-2">Join a Club</h2>
                <p className="text-sm text-white/50 mb-4">Clubs are required to compete in official matches.</p>

                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clubs by name or city..."
                    className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 pl-9 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00ff85]/50"
                  />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredClubs.slice(0, 8).map((club) => (
                    <button
                      key={club.id}
                      onClick={() => setSelectedClub(club.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-sm border transition text-left ${
                        selectedClub === club.id
                          ? "border-[#00ff85] bg-[#00ff85]/5"
                          : "border-[#1a1a1a] bg-[#111] hover:border-[#1a1a1a]"
                      }`}
                    >
                      <div>
                        <span className="text-white font-bold text-sm">{club.name}</span>
                        <p className="text-xs text-white/40">{club.city} · {club.memberCount} members</p>
                      </div>
                      {selectedClub === club.id && (
                        <span className="text-[#00ff85] text-xs font-bold">Selected</span>
                      )}
                    </button>
                  ))}
                </div>

                {message && (
                  <p className={`text-sm mt-3 ${message.includes("sent") ? "text-[#00ff85]" : "text-red-400"}`}>{message}</p>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSkipClub}
                    className="flex-1 h-10 rounded-sm border border-[#1a1a1a] text-white/60 text-sm font-bold hover:text-white transition"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleJoinClub}
                    disabled={!selectedClub || joining}
                    className="flex-1 h-10 rounded-sm bg-[#00ff85] text-[#050505] text-sm font-black tracking-[0.1em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {joining ? "Sending..." : "Request to Join"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-white mb-4">You're Ready to Play</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-sm border border-[#00ff85]/20 bg-[#00ff85]/5">
                    <p className="text-sm text-[#00ff85] font-bold">Your first match awaits</p>
                    <ul className="text-xs text-white/50 mt-2 space-y-1">
                      <li>• Challenge players near your skill level</li>
                      <li>• Win to climb the leaderboard</li>
                      <li>• Beat higher-ranked players for bigger jumps</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full h-12 mt-6 rounded-sm bg-[#00ff85] text-[#050505] font-black text-sm tracking-[0.15em] hover:bg-white transition animate-pulse"
                >
                  PLAY YOUR FIRST MATCH →
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
