"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

type SearchResult = {
  players?: {
    id: string
    username: string
    avatarUrl: string | null
    role: string
    isVerified: boolean
    playerStats: { wins: number; losses: number; goalsScored: number } | null
  }[]
  clubs?: {
    id: string
    name: string
    slug: string
    city: string
    logoUrl: string | null
    globalRank: { rankPosition: number } | null
    _count: { members: number }
  }[]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!query) return

    const search = async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (!res.ok) {
          setError("Search failed")
          return
        }
        const data = await res.json()
        setResults(data)
      } catch {
        setError("Network error")
      } finally {
        setLoading(false)
      }
    }

    search()
  }, [query])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Force refresh by updating key or state
    window.location.href = `/search?q=${encodeURIComponent(query)}`
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <h1 className="bc-headline text-3xl text-white">Search</h1>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players or clubs..."
            className="w-full rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-white placeholder-white/40 focus:border-[#00ff85] focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-2 top-2 h-8 w-8 rounded-sm bg-[#00ff85]/10 text-[#00ff85] flex items-center justify-center hover:bg-[#00ff85]/20 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </form>

        {loading && <p className="text-white/40">Searching...</p>}
        {error && <p className="text-red-400">{error}</p>}

        {results && (
          <div className="space-y-8">
            {results.players && results.players.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Players</h2>
                <div className="space-y-2">
                  {results.players.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 hover:bg-white/5 transition"
                    >
                      <div className="h-10 w-10 rounded-sm bg-[#111] flex items-center justify-center text-sm font-bold text-white">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl} alt={p.username} className="w-full h-full object-cover rounded-sm" />
                        ) : (
                          p.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{p.username}</span>
                          {p.isVerified && <span className="text-[#00ff85] text-xs">✓</span>}
                        </div>
                        {p.playerStats && (
                          <p className="text-xs text-white/40">
                            {p.playerStats.wins}W / {p.playerStats.losses}L · {p.playerStats.goalsScored} goals
                          </p>
                        )}
                      </div>
                      <Link href={`/users/${p.id}`} className="text-xs text-[#00ff85] hover:underline">Profile →</Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.clubs && results.clubs.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Clubs</h2>
                <div className="space-y-2">
                  {results.clubs.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 hover:bg-white/5 transition"
                    >
                      <div className="h-12 w-12 rounded-sm bg-[#111] flex items-center justify-center text-sm font-bold text-[#00ff85]">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover rounded-sm" />
                        ) : (
                          c.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold">{c.name}</span>
                          {c.globalRank && (
                            <span className="text-xs font-mono text-[#ffb800]">#{c.globalRank.rankPosition}</span>
                          )}
                        </div>
                        <p className="text-xs text-white/40">{c.city} · {c._count.members} members</p>
                      </div>
                      <Link href={`/clubs/${c.slug}`} className="text-xs text-[#00ff85] hover:underline">View →</Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {results.players?.length === 0 && results.clubs?.length === 0 && (
              <p className="text-white/40 text-center py-10">No results found for "{query}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
