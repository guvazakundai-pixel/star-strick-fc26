"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

type ClubItem = {
  id: string
  name: string
  slug: string
  tag: string
  tagline: string
  logoUrl: string | null
  city: string
  country: string
  description: string
  isVerified: boolean
  membersInviteOnly: boolean
  isPublic: boolean
  joinCode: string
  clubXp: number
  winRate: number
  memberCount: number
  achievementCount: number
  featuredLegends: string[]
  globalRank: {
    rankPosition: number
    totalPoints: number
    wins: number
    losses: number
    draws: number
    played: number
    goalsFor: number
    goalsAgainst: number
    momentum: number
  } | null
  manager: { username: string; displayName: string }
}

const RANK_STYLES: Record<number, { label: string; glow: string; gradient: string; border: string }> = {
  1: { label: "#1 GOLD", glow: "rgba(255,215,0,0.3)", gradient: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,184,0,0.04))", border: "rgba(255,215,0,0.2)" },
  2: { label: "#2 SILVER", glow: "rgba(192,192,192,0.3)", gradient: "linear-gradient(135deg, rgba(100,140,255,0.12), rgba(59,130,246,0.04))", border: "rgba(100,140,255,0.2)" },
  3: { label: "#3 BRONZE", glow: "rgba(205,127,50,0.3)", gradient: "linear-gradient(135deg, rgba(205,127,50,0.12), rgba(168,85,247,0.04))", border: "rgba(205,127,50,0.2)" },
}

const DEFAULT_GRADIENT = "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,255,133,0.04))"
const DEFAULT_BORDER = "rgba(168,85,247,0.10)"

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple">Competition</p>
          <h1 className="bc-headline text-3xl sm:text-5xl md:text-6xl text-ink mt-1.5">
            ZIMFC <span className="text-gradient-pink">Clubs</span>
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Represent a gaming hub. Compete for glory. Rise through the ranks.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6,7].map((i) => (
              <div key={i} className="rounded-[24px] p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-5 w-28 rounded-md bg-white/5 mb-3" />
                <div className="h-3 w-40 rounded-md bg-white/3 mb-4" />
                <div className="h-3 w-20 rounded-md bg-white/3" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="glass p-12 text-center space-y-4 rounded-[24px]">
            <p className="cinematic-heading text-3xl text-ink">No clubs yet</p>
            <p className="text-sm text-muted">The first esports hub hasn't been created yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const rank = club.globalRank?.rankPosition ?? 99
              const style = RANK_STYLES[rank] || { label: `#${rank}`, glow: "rgba(168,85,247,0.15)", gradient: DEFAULT_GRADIENT, border: DEFAULT_BORDER }
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <Link
                    href={`/club/${club.slug}`}
                    className="block group relative overflow-hidden rounded-[24px] transition-all duration-400 hover:scale-[1.02]"
                    style={{
                      background: style.gradient,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${style.border}`,
                      boxShadow: `0 4px 24px ${style.glow}`,
                    }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.04] transition-all duration-500 group-hover:opacity-[0.10] group-hover:scale-110"
                      style={{ background: "radial-gradient(circle, currentColor, transparent 70%)", color: rank === 1 ? "gold" : rank === 2 ? "#648cff" : "var(--accent)" }}
                    />
                    <div className="relative z-10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-ink font-bold text-lg group-hover:text-accent transition-colors duration-300 truncate">
                              {club.name}
                            </p>
                            {club.isVerified && (
                              <span className="pill-accent text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">✓</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-soft mt-0.5 font-mono">
                            [{club.tag}] · {club.city}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{
                              background: rank <= 3 ? `rgba(255,215,0,0.12)` : `rgba(168,85,247,0.10)`,
                              color: rank <= 3 ? "#ffd700" : "var(--accent)",
                              border: `1px solid ${rank <= 3 ? "rgba(255,215,0,0.2)" : "rgba(168,85,247,0.15)"}`,
                              boxShadow: rank <= 3 ? `0 2px 12px ${style.glow}` : "none",
                            }}
                          >
                            {style.label}
                          </span>
                        </div>
                      </div>

                      {club.tagline && (
                        <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">
                          {club.tagline}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-faint">
                        <span className="flex items-center gap-1">
                          <UsersIcon />
                          {club.memberCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <XPIcon />
                          {club.clubXp.toLocaleString()} XP
                        </span>
                        {club.winRate > 0 && (
                          <span className="flex items-center gap-1" style={{ color: club.winRate >= 60 ? "var(--accent)" : undefined }}>
                            <TrophyIcon />
                            {club.winRate}% WR
                          </span>
                        )}
                        {club.achievementCount > 0 && (
                          <span className="flex items-center gap-1">{club.achievementCount} 🏆</span>
                        )}
                      </div>

                      {club.featuredLegends.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gold/70">Legends:</span>
                          <div className="flex flex-wrap gap-1">
                            {club.featuredLegends.slice(0, 3).map((legend) => (
                              <span
                                key={legend}
                                className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{
                                  background: "rgba(255,215,0,0.08)",
                                  color: "#ffd700",
                                  border: "1px solid rgba(255,215,0,0.10)",
                                }}
                              >
                                {legend}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-muted-faint">
                          {club.globalRank ? `${club.globalRank.wins}W · ${club.globalRank.losses}L · ${club.globalRank.draws}D` : "No data"}
                        </span>
                        <span className="text-muted-soft group-hover:text-accent transition-colors duration-300 flex items-center gap-1">
                          View Club
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

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function XPIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
