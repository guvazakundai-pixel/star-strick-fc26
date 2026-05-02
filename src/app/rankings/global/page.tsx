"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

type GlobalRanking = {
  id: string
  rankPosition: number
  totalPoints: number
  wins: number
  losses: number
  club: {
    id: string
    name: string
    slug: string
    city: string
    manager: { username: string }
    _count: { members: number }
  }
}

const PAGE_SIZE = 10

export default function GlobalRankingsPage() {
  const { user } = useAuth()
  const [rankings, setRankings] = useState<GlobalRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [recalculating, setRecalculating] = useState(false)

  useEffect(() => {
    fetch("/api/rankings/global")
      .then((r) => r.json())
      .then((data) => setRankings(data.rankings ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRecalculate = async () => {
    setRecalculating(true)
    await fetch("/api/rankings/global/recalculate", { method: "POST" })
    const data = await fetch("/api/rankings/global").then((r) => r.json())
    setRankings(data.rankings ?? [])
    setRecalculating(false)
  }

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>

  const totalPages = Math.ceil(rankings.length / PAGE_SIZE)
  const paged = rankings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="bc-headline text-3xl sm:text-4xl text-white">Global Rankings</h1>
          <div className="flex gap-2">
            {user?.role === "ADMIN" && (
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="h-10 px-4 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] text-white/60 text-xs font-bold hover:border-[#00ff85] hover:text-[#00ff85] transition disabled:opacity-50"
              >
                {recalculating ? "Recalculating..." : "Recalculate"}
              </button>
            )}
          </div>
        </div>

        {rankings.length === 0 ? (
          <p className="text-white/50">No rankings yet</p>
        ) : (
          <>
            <div className="space-y-3">
              {paged.map((r, i) => {
                const globalIdx = page * PAGE_SIZE + i
                const prev = globalIdx > 0 ? rankings[globalIdx - 1] : null
                const trend = prev ? r.totalPoints - prev.totalPoints : 0

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden"
                  >
                    <div className="flex items-center">
                      <div className={`w-14 shrink-0 text-center py-4 ${globalIdx === 0 ? "bg-[#ffb800]/10" : globalIdx === 1 ? "bg-white/5" : globalIdx === 2 ? "bg-orange-500/5" : ""}`}>
                        <span className={`text-2xl font-black ${globalIdx === 0 ? "text-[#ffb800]" : globalIdx === 1 ? "text-white/70" : globalIdx === 2 ? "text-orange-400" : "text-white/30"}`}>
                          {r.rankPosition}
                        </span>
                      </div>

                      <Link href={`/clubs/${r.club.slug}`} className="flex-1 px-4 py-4 hover:bg-white/5 transition">
                        <p className="text-white font-bold text-lg">{r.club.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {r.club.city} · {r.club._count.members} members · Managed by {r.club.manager.username}
                        </p>
                        <div className="flex gap-4 mt-2 text-xs text-white/30">
                          <span>{r.wins}W / {r.losses}L</span>
                          <span>{r.totalPoints} points</span>
                        </div>
                      </Link>

                      <div className="px-4 shrink-0 text-right">
                        {trend > 0 ? (
                          <span className="text-[#00ff85] text-sm font-bold">▲ Rising</span>
                        ) : trend < 0 ? (
                          <span className="text-red-400 text-sm font-bold">▼ Falling</span>
                        ) : (
                          <span className="text-white/30 text-sm">—</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-sm text-sm font-bold transition ${i === page ? "bg-[#00ff85] text-[#050505]" : "border border-[#1a1a1a] bg-[#0a0a0a] text-white/50 hover:text-white"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
