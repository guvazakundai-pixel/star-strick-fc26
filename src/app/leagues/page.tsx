"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

type LeagueItem = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  type: string
  status: string
  inviteCode: string | null
  maxPlayers: number
  createdAt: string
  admin: { username: string; displayName: string | null }
  participantCount: number
  fixtureCount: number
}

const STATUS_COLORS: Record<string, string> = {
  REGISTRATION: "text-cyan border-cyan/20 bg-cyan/8",
  ACTIVE: "text-accent border-accent/16 bg-accent/8",
  COMPLETED: "text-gold border-gold/20 bg-gold/8",
  PAUSED: "text-orange border-orange/20 bg-orange/8",
}

const TYPE_BADGES: Record<string, string> = {
  PUBLIC: "🌍 Public",
  PRIVATE: "🔒 Private",
  FRIENDS: "👥 Friends",
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<LeagueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  useEffect(() => {
    const params = filter !== "all" ? `?type=${filter}` : ""
    fetch(`/api/leagues${params}`)
      .then((r) => r.json())
      .then((d) => setLeagues(d.leagues ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="broadcast-theme min-h-screen bc-noise pb-28">
      <div className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple">Competition</p>
          <h1 className="bc-headline text-3xl sm:text-5xl md:text-6xl text-ink mt-1.5">
            <span className="text-gradient-pink">Leagues</span>
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Football-style leagues. Seasons. Fixtures. Standings. Compete across weeks.
          </p>

          <div className="flex gap-2 mt-5 flex-wrap">
            {["all", "PUBLIC", "PRIVATE", "FRIENDS"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  filter === f ? "text-black" : "text-muted-soft hover:text-ink"
                }`}
                style={filter === f ? { background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.2)" } : { background: "rgba(255,255,255,0.04)" }}
              >
                {f === "all" ? "All" : TYPE_BADGES[f] || f}
              </button>
            ))}
            <Link
              href="/leagues/create"
              className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider text-black ml-auto"
              style={{ background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.2)" }}
            >
              + Create
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="rounded-[24px] p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-5 w-32 rounded-md bg-white/5 mb-3" />
                <div className="h-3 w-24 rounded-md bg-white/3 mb-4" />
                <div className="h-3 w-16 rounded-md bg-white/3" />
              </div>
            ))}
          </div>
        ) : leagues.length === 0 ? (
          <div className="rounded-[24px] p-12 text-center space-y-4" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="cinematic-heading text-3xl text-ink">No leagues found</p>
            <p className="text-sm text-muted">Create the first league or adjust your filters.</p>
            <Link href="/leagues/create" className="inline-flex px-5 py-2.5 rounded-[14px] text-sm font-bold text-black"
              style={{ background: "var(--accent)" }}>
              Create League
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league, i) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/leagues/${league.id}`}
                  className="block rounded-[24px] p-5 transition-all duration-300 hover:scale-[1.02]"
                  style={{ border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-ink truncate">{league.name}</h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${STATUS_COLORS[league.status] || ""}`}>
                          {league.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-soft mt-0.5 font-mono">{TYPE_BADGES[league.type] || league.type}</p>
                    </div>
                  </div>

                  {league.description && (
                    <p className="text-xs text-muted mt-2 line-clamp-2">{league.description}</p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-faint">
                    <span>👥 {league.participantCount}/{league.maxPlayers}</span>
                    {league.fixtureCount > 0 && <span>⚽ {league.fixtureCount} fixtures</span>}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-muted-faint">
                    <span>by {league.admin.displayName || league.admin.username}</span>
                    <span>{new Date(league.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
