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
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Clubs</p>
          <h1 className="bc-headline text-3xl sm:text-4xl text-ink mt-1">All Clubs</h1>
        </div>

        {loading ? (
          <p className="text-muted-soft">Loading clubs...</p>
        ) : clubs.length === 0 ? (
          <p className="text-muted">No clubs yet. Be the first to create one!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/club/${club.slug}`}
                  className="block frosted-card-sm p-5 hover:border-accent/18 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-ink font-bold text-lg group-hover:text-accent transition-colors duration-200">{club.name}</p>
                        {club.isVerified && (
                          <span className="pill-accent text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-soft mt-1">{club.city}, {club.country}</p>
                    </div>
                    {club.globalRank && (
                      <span className="pill-gold text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full">#{club.globalRank.rankPosition}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-soft">
                    <span>{club.memberCount} members</span>
                    <span className="text-muted-faint group-hover:text-accent transition-colors duration-200">→</span>
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