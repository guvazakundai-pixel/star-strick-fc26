"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-context"

interface LeaderboardPlayer {
  id: string
  username: string
  avatarUrl?: string
  playerStatus: "UNPLACED" | "PLACED" | "RANKED"
  points: number
  wins: number
  losses: number
  draws: number
  skillRating: number
  rank?: number
  prevRank?: number
  clubName?: string
  isCurrentUser?: boolean
}

export function LiveLeaderboard() {
  const { user } = useAuth()
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "ranked" | "unplaced">("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => setPlayers(data.players ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = players.filter((p) => {
    if (filter === "ranked" && p.playerStatus === "UNPLACED") return false
    if (filter === "unplaced" && p.playerStatus !== "UNPLACED") return false
    if (search && !p.username.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players..."
            className="w-full h-10 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-3 pl-9 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00ff85]/50"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="flex gap-2">
          {(["all", "ranked", "unplaced"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 rounded-sm text-xs font-bold transition capitalize ${
                filter === f
                  ? "bg-[#00ff85]/10 text-[#00ff85]"
                  : "bg-[#111] text-white/50 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><p className="text-white/40">Loading leaderboard...</p></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-12 text-center">
          <p className="text-white/40">No players found</p>
        </div>
      ) : (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/40 border-b border-[#1a1a1a]">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Points</div>
            <div className="col-span-2 text-right">W/L</div>
            <div className="col-span-1 text-right">Rating</div>
          </div>

          <AnimatePresence>
            {filtered.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#1a1a1a] last:border-0 transition ${
                  player.isCurrentUser
                    ? "bg-[#00ff85]/5"
                    : player.playerStatus === "UNPLACED"
                    ? "opacity-50"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                <div className="col-span-1 flex items-center">
                  {player.playerStatus === "UNPLACED" ? (
                    <span className="text-white/20 font-mono text-sm">—</span>
                  ) : (
                    <span className={`font-mono text-sm font-bold ${
                      player.rank === 1 ? "text-[#ffb800]" :
                      player.rank === 2 ? "text-white/70" :
                      player.rank === 3 ? "text-orange-400" : "text-white/50"
                    }`}>
                      {player.rank}
                    </span>
                  )}
                </div>

                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <div className={`h-7 w-7 rounded-sm flex items-center justify-center text-xs font-bold shrink-0 ${
                    player.isCurrentUser
                      ? "bg-[#00ff85]/20 text-[#00ff85]"
                      : "bg-[#111] text-white/60"
                  }`}>
                    {player.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold truncate ${
                      player.isCurrentUser ? "text-[#00ff85]" : "text-white"
                    }`}>
                      {player.username}
                      {player.isCurrentUser && <span className="ml-1 text-[10px]">(You)</span>}
                    </p>
                    {player.clubName && (
                      <p className="text-[10px] text-white/30 truncate">{player.clubName}</p>
                    )}
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                  {player.playerStatus === "UNPLACED" ? (
                    <span className="px-2 py-0.5 rounded-sm bg-white/5 text-white/30 text-[10px] font-bold">
                      Unranked
                    </span>
                  ) : player.playerStatus === "PLACED" ? (
                    <span className="px-2 py-0.5 rounded-sm bg-[#ffb800]/10 text-[#ffb800] text-[10px] font-bold">
                      Placed
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-[10px] font-bold">
                      Ranked
                    </span>
                  )}
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <span className={`text-sm font-bold ${
                    player.playerStatus === "UNPLACED" ? "text-white/20" : "text-white"
                  }`}>
                    {player.playerStatus === "UNPLACED" ? "—" : player.points}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-end">
                  <span className={`text-sm ${
                    player.playerStatus === "UNPLACED" ? "text-white/20" : "text-white/60"
                  }`}>
                    {player.playerStatus === "UNPLACED" ? "—" : `${player.wins}/${player.losses}`}
                  </span>
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <span className={`text-sm font-mono ${
                    player.playerStatus === "UNPLACED" ? "text-white/20" : "text-white/50"
                  }`}>
                    {player.playerStatus === "UNPLACED" ? "—" : Math.round(player.skillRating)}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
