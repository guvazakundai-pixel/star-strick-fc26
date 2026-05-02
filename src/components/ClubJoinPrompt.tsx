"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Club {
  id: string
  name: string
  city: string
  memberCount: number
  description?: string
}

export function ClubJoinPrompt({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const clubsData = (data.clubs ?? []).map((c: Record<string, unknown> & { _count?: { members: number } }) => ({
          id: c.id as string,
          name: c.name as string,
          city: c.city as string,
          memberCount: c._count?.members ?? 0,
          description: c.description as string | undefined,
        }))
        setClubs(clubsData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  )

  async function handleJoin() {
    if (!selectedClub) return
    setJoining(true)
    setMessage("")
    try {
      const res = await fetch(`/api/clubs/${selectedClub}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        setMessage("Join request sent! Wait for manager approval.")
        setTimeout(() => onClose?.(), 2000)
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

  return (
    <div className="rounded-sm border border-[#00ff85]/20 bg-[#0a0a0a] overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#00ff85] uppercase tracking-wider">Join a Club</h3>
          <p className="text-xs text-white/40 mt-1">Required to compete in official matches</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="relative mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full h-9 rounded-sm border border-[#1a1a1a] bg-[#111] px-3 pl-8 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00ff85]/50"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {loading ? (
          <p className="text-white/30 text-sm">Loading clubs...</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filtered.slice(0, 5).map((club) => (
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
                  <span className="text-[#00ff85] text-xs font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        )}

        {message && (
          <p className={`text-sm mt-3 ${message.includes("sent") ? "text-[#00ff85]" : "text-red-400"}`}>{message}</p>
        )}

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => router.push("/manager/apply")}
            className="flex-1 h-9 rounded-sm border border-[#1a1a1a] text-white/50 text-xs font-bold hover:text-white transition"
          >
            Create Club
          </button>
          <button
            onClick={handleJoin}
            disabled={!selectedClub || joining}
            className="flex-1 h-9 rounded-sm bg-[#00ff85] text-[#050505] text-xs font-black tracking-[0.1em] hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {joining ? "Sending..." : "Request to Join"}
          </button>
        </div>
      </div>
    </div>
  )
}
