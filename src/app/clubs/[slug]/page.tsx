"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

type ClubData = {
  id: string
  name: string
  slug: string
  city: string
  country: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  manager: { id: string; username: string; avatarUrl: string | null }
  globalRank: { rankPosition: number; totalPoints: number; wins: number; losses: number } | null
  _count: { members: number }
}

type PlayerRanking = {
  id: string
  rankPosition: number
  points: number
  user: {
    id: string
    username: string
    avatarUrl: string | null
    playerStats: { matchesPlayed: number; wins: number; losses: number; goalsScored: number } | null
  }
}

export default function ClubProfilePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [club, setClub] = useState<ClubData | null>(null)
  const [topPlayers, setTopPlayers] = useState<PlayerRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/clubs/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.club) {
          setClub(data.club)
          setTopPlayers(data.topPlayers ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>
  if (!club) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-red-400">Club not found</p></div>

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl">
        {club.bannerUrl && (
          <div className="h-48 sm:h-64 overflow-hidden relative">
            <img src={club.bannerUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
          </div>
        )}

        <div className="px-4 py-6 -mt-16 relative z-10 space-y-6">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 rounded-sm border-4 border-[#050505] bg-[#0a0a0a] overflow-hidden shrink-0">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-[#00ff85]">
                  {club.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="pb-1">
              <h1 className="bc-headline text-3xl sm:text-4xl text-white">{club.name}</h1>
              <p className="text-sm text-white/50">{club.city}, {club.country}</p>
            </div>
          </div>

          {club.globalRank && (
            <div className="grid grid-cols-3 gap-3">
              <KpiCard label="Global Rank" value={`#${club.globalRank.rankPosition}`} tone="gold" />
              <KpiCard label="Members" value={String(club._count.members)} tone="neon" />
              <KpiCard label="Total Points" value={String(club.globalRank.totalPoints)} tone="neon" />
            </div>
          )}

          <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-2">About</h2>
            <p className="text-white/70 text-sm">{club.description || "No description yet."}</p>
            <p className="text-white/30 text-xs mt-3">Managed by {club.manager.username}</p>
          </div>

          <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Top Players</h2>
            {topPlayers.length === 0 ? (
              <p className="text-white/40 text-sm">No rankings yet</p>
            ) : (
              <div className="space-y-2">
                {topPlayers.map((p, i) => (
                  <motion.div
                    key={p.user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3"
                  >
                    <span className={`text-lg font-black w-8 text-center ${i === 0 ? "text-[#ffb800]" : i === 1 ? "text-white/70" : "text-white/40"}`}>
                      #{p.rankPosition}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{p.user.username}</p>
                      {p.user.playerStats && (
                        <p className="text-xs text-white/40">
                          {p.user.playerStats.wins}W / {p.user.playerStats.losses}L · {p.user.playerStats.goalsScored} goals
                        </p>
                      )}
                    </div>
                    <span className="text-[#00ff85] font-mono font-bold">{p.points} pts</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value, tone }: { label: string; value: string; tone: "neon" | "gold" }) {
  const valueColor = tone === "neon" ? "#00ff85" : "#ffb800"
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className="text-2xl font-black font-mono mt-1" style={{ color: valueColor }}>{value}</p>
    </div>
  )
}
