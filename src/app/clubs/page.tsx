"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

type ClubItem = {
  id: string
  name: string
  slug: string
  tag: string
  logoUrl: string | null
  city: string
  country: string
  isVerified: boolean
  membersInviteOnly: boolean
  memberCount: number
  globalRank: { rankPosition: number; totalPoints: number } | null
  manager: { username: string; displayName: string | null }
}

const CLUB_COLORS = [
  { from: "rgba(34,211,238,0.08)", to: "rgba(59,130,246,0.04)", border: "rgba(34,211,238,0.10)" },
  { from: "rgba(168,85,247,0.08)", to: "rgba(236,72,153,0.04)", border: "rgba(168,85,247,0.10)" },
  { from: "rgba(52,211,153,0.08)", to: "rgba(0,255,133,0.04)", border: "rgba(52,211,153,0.10)" },
  { from: "rgba(249,115,22,0.08)", to: "rgba(255,184,0,0.04)", border: "rgba(249,115,22,0.10)" },
  { from: "rgba(236,72,153,0.08)", to: "rgba(168,85,247,0.04)", border: "rgba(236,72,153,0.10)" },
  { from: "rgba(59,130,246,0.08)", to: "rgba(34,211,238,0.04)", border: "rgba(59,130,246,0.10)" },
]

export default function ClubsPage() {
  const [clubs, setClubs] = useState<ClubItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => setClubs(data.clubs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(600px 250px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple">Clubs</p>
          <h1 className="bc-headline text-3xl sm:text-5xl md:text-6xl text-ink mt-1.5">
            All <span className="text-gradient-pink">Clubs</span>
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Compete under a banner. Find your team and rise together.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="frosted-card-sm p-5 animate-pulse">
                <div className="h-5 w-24 rounded-md bg-white/5 mb-3" />
                <div className="h-3 w-32 rounded-md bg-white/3 mb-4" />
                <div className="h-3 w-16 rounded-md bg-white/3" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="glass p-12 text-center space-y-4">
            <p className="cinematic-heading text-3xl text-ink">No clubs yet</p>
            <p className="text-sm text-muted">Be the first to create one!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const colors = CLUB_COLORS[i % CLUB_COLORS.length]
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <Link
                    href={`/club/${club.slug}`}
                    className="block group relative overflow-hidden rounded-[24px] transition-all duration-400"
                    style={{
                      background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-[0.06] transition-opacity duration-500 group-hover:opacity-[0.10]"
                      style={{ background: "radial-gradient(circle, currentColor, transparent 70%)", color: "inherit" }}
                    />
                    <div className="relative z-10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-ink font-bold text-lg group-hover:text-accent transition-colors duration-300 truncate">
                              {club.name}
                            </p>
                            {club.isVerified && (
                              <span className="pill-accent text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-soft mt-1">
                            {club.city}, {club.country}
                          </p>
                        </div>
                        {club.globalRank && (
                          <span className="shrink-0 pill-gold text-[10px] font-bold tabular-nums px-2.5 py-0.5 rounded-full" style={{ boxShadow: "0 2px 8px rgba(255,184,0,0.15)" }}>
                            #{club.globalRank.rankPosition}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-soft">
                        <span>{club.memberCount} members</span>
                        <span className="text-muted-faint group-hover:text-accent transition-colors duration-300 flex items-center gap-1">
                          View
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}