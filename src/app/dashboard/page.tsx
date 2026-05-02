"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import Link from "next/link"

interface PlayerStats {
  wins: number
  losses: number
  draws: number
  matchesPlayed: number
  skillRating: number
  winStreak: number
  formHistory: string
}

interface ClubInfo {
  id: string
  name: string
  slug: string
}

export default function PlayerDashboard() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [club, setClub] = useState<ClubInfo | null>(null)
  const [recentMatches, setRecentMatches] = useState<Record<string, unknown>[]>([])
  const [pendingRequests, setPendingRequests] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    if (!user.onboardingComplete) {
      router.push("/onboarding")
      return
    }

    Promise.all([
      fetch(`/api/players/${user.id}/stats`).catch(() => null),
      fetch("/api/clubs/my").catch(() => null),
      fetch(`/api/matches?playerId=${user.id}&limit=5`).catch(() => null),
      fetch("/api/match-requests?type=received").catch(() => null),
    ])
      .then(([statsRes, clubRes, matchesRes, requestsRes]) => {
        if (statsRes?.ok) return statsRes.json().then((d) => d.stats).catch(() => null)
        return null
      })
      .then((s) => {
        if (s) setStats(s)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, router])

  if (!user || loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>
  }

  const isUnranked = user.playerStatus === "UNPLACED"
  const winRate = stats && stats.matchesPlayed > 0
    ? Math.round((stats.wins / stats.matchesPlayed) * 100)
    : 0

  return (
    <div className="broadcast-theme min-h-screen bc-noise pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">{user.username}</h1>
            {isUnranked ? (
              <span className="inline-block mt-1 px-2 py-0.5 rounded-sm bg-white/5 text-white/40 text-xs font-bold">
                UNRANKED
              </span>
            ) : (
              <p className="text-[#00ff85] text-sm font-bold">Rating: {stats ? Math.round(stats.skillRating) : "—"}</p>
            )}
          </div>
          <Link
            href="/profile/edit"
            className="h-9 px-3 rounded-sm border border-[#1a1a1a] text-white/50 text-xs font-bold hover:text-white transition"
          >
            Edit Profile
          </Link>
        </div>

        {/* Unranked CTA */}
        {isUnranked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-[#ffb800]/30 bg-[#ffb800]/5 p-4 mb-6"
          >
            <p className="text-[#ffb800] font-bold text-sm">Play your first match to get ranked!</p>
            <p className="text-white/40 text-xs mt-1">After your first verified match, you'll be placed on the leaderboard.</p>
            <button
              onClick={() => router.push("/matches/find")}
              className="mt-3 h-9 px-4 rounded-sm bg-[#ffb800] text-[#050505] text-xs font-black tracking-[0.1em] hover:bg-white transition"
            >
              FIND OPPONENT →
            </button>
          </motion.div>
        )}

        {/* Club prompt */}
        {!club && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-[#00ff85]/20 bg-[#00ff85]/5 p-4 mb-6"
          >
            <p className="text-[#00ff85] font-bold text-sm">Join a club to compete officially</p>
            <p className="text-white/40 text-xs mt-1">Matches without a club don't count toward rankings.</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => router.push("/clubs")}
                className="h-8 px-3 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-xs font-bold hover:bg-[#00ff85]/20 transition"
              >
                Browse Clubs
              </button>
              <button
                onClick={() => router.push("/manager/apply")}
                className="h-8 px-3 rounded-sm border border-[#1a1a1a] text-white/50 text-xs font-bold hover:text-white transition"
              >
                Create Club
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard label="Rating" value={String(Math.round(stats.skillRating))} tone="neon" />
            <StatCard label="Win Rate" value={`${winRate}%`} tone={winRate > 50 ? "neon" : "gold"} />
            <StatCard label="Matches" value={String(stats.matchesPlayed)} tone="gold" />
            <StatCard label="Streak" value={`${stats.winStreak}W`} tone={stats.winStreak > 0 ? "neon" : ""} />
          </div>
        )}

        {/* Pending Requests */}
        {pendingRequests > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border border-[#ffb800]/30 bg-[#ffb800]/5 p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#ffb800] font-bold text-sm">{pendingRequests} pending challenge{pendingRequests > 1 ? "s" : ""}</p>
                <p className="text-white/40 text-xs">Someone wants to play!</p>
              </div>
              <button
                onClick={() => router.push("/matches/requests")}
                className="h-8 px-4 rounded-sm bg-[#ffb800] text-[#050505] text-xs font-black tracking-[0.1em] hover:bg-white transition"
              >
                VIEW →
              </button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => router.push("/matches/find")}
            className="rounded-sm border border-[#00ff85]/30 bg-[#00ff85]/5 p-6 text-center hover:bg-[#00ff85]/10 transition group"
          >
            <div className="h-10 w-10 rounded-full bg-[#00ff85]/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#00ff85]">
                <circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm">Play Match</p>
            <p className="text-white/30 text-xs mt-1">Challenge a player</p>
          </button>

          <button
            onClick={() => router.push("/matches/requests")}
            className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6 text-center hover:border-[#1a1a1a] transition group"
          >
            <div className="h-10 w-10 rounded-full bg-[#111] flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white/60">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-white font-bold text-sm">Requests</p>
            <p className="text-white/30 text-xs mt-1">{pendingRequests} pending</p>
          </button>
        </div>

        {/* Recent Matches */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/50">Recent Matches</h2>
            <Link href="/matches" className="text-xs text-[#00ff85] font-bold hover:underline">View All</Link>
          </div>
          {recentMatches.length === 0 ? (
            <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
              <p className="text-white/40">No matches yet</p>
              <button
                onClick={() => router.push("/matches/find")}
                className="mt-3 text-[#00ff85] text-sm font-bold hover:underline"
              >
                Play your first match →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => (
                <div key={match.id as string} className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">
                      {match.player1?.username as string} vs {match.player2?.username as string}
                    </p>
                    <p className="text-xs text-white/30">{new Date(match.createdAt as string).toLocaleDateString()}</p>
                  </div>
                  <span className="text-[#00ff85] font-black text-lg">
                    {match.score1 as number} - {match.score2 as number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const colors: Record<string, string> = {
    neon: "text-[#00ff85]",
    gold: "text-[#ffb800]",
  }
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colors[tone ?? ""] || "text-white"}`}>{value}</p>
    </div>
  )
}
