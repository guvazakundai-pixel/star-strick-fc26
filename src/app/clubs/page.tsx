"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function ClubsPage() {
  const [clubs, setClubs] = useState<{ id: string; name: string; slug: string; city: string; country: string; globalRank: { rankPosition: number; totalPoints: number } | null; _count: { members: number }; manager: { username: string } }[]>([])
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
        <h1 className="bc-headline text-3xl sm:text-4xl text-white">All Clubs</h1>

        {loading ? (
          <p className="text-white/40">Loading clubs...</p>
        ) : clubs.length === 0 ? (
          <p className="text-white/50">No clubs yet. Be the first to create one!</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/clubs/${club.slug}`}
                  className="block rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-5 hover:border-[#00ff85] transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold text-lg group-hover:text-[#00ff85] transition">{club.name}</p>
                      <p className="text-xs text-white/40 mt-1">{club.city}, {club.country}</p>
                    </div>
                    {club.globalRank && (
                      <span className="text-xs font-mono text-[#ffb800]">#{club.globalRank.rankPosition}</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-white/30">
                    <span>{club._count.members} members</span>
                    <span>→</span>
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
