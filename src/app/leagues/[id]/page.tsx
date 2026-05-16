"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "@/lib/session-client"

type LeagueData = {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  type: string
  status: string
  inviteCode: string | null
  maxPlayers: number
  settings: any
  createdAt: string
  admin: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  participantCount: number
  fixtureCount: number
  season: { id: string; number: number; status: string } | null
}

type StandingRow = {
  userId: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  points: number
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  form: string
  cleanSheets: number
  skillRating: number
  globalRank: number | null
}

type FixtureItem = {
  id: string
  matchday: number
  homePlayerId: string
  awayPlayerId: string
  homeScore: number | null
  awayScore: number | null
  status: string
  homePlayer: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  awayPlayer: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
}

type MatchdayGroup = {
  matchday: number
  matches: FixtureItem[]
}

export default function LeagueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const session = useSession()
  const leagueId = params?.id as string

  const [league, setLeague] = useState<LeagueData | null>(null)
  const [standings, setStandings] = useState<StandingRow[]>([])
  const [matchdayGroups, setMatchdayGroups] = useState<MatchdayGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedMatchday, setSelectedMatchday] = useState<number>(1)
  const [scoreModal, setScoreModal] = useState<{ fixture: FixtureItem } | null>(null)
  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")
  const [scoreLoading, setScoreLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchLeague = useCallback(async () => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}`)
      if (!res.ok) { setError("League not found"); return }
      const data = await res.json()
      setLeague(data.league)
      setStandings(data.standings ?? [])
      setMatchdayGroups(data.matchesByMatchday ?? [])
      if (data.matchesByMatchday?.length > 0) {
        setSelectedMatchday(data.matchesByMatchday[0].matchday)
      }
    } catch { setError("Failed to load") }
    finally { setLoading(false) }
  }, [leagueId])

  useEffect(() => { fetchLeague() }, [fetchLeague])

  const isAdmin = league && (league.admin.id === session?.userId || session?.role === "ADMIN")
  const isParticipant = standings.some((s) => s.userId === session?.userId)

  const matchday = matchdayGroups.find((mg) => mg.matchday === selectedMatchday)
  const totalMatchdays = matchdayGroups.length

  const handleSubmitScore = async () => {
    if (!scoreModal) return
    setScoreLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/fixtures/${scoreModal.fixture.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          homeScore: parseInt(homeScore),
          awayScore: parseInt(awayScore),
        }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); return }
      setScoreModal(null)
      setHomeScore("")
      setAwayScore("")
      fetchLeague()
    } catch { alert("Something went wrong") }
    finally { setScoreLoading(false) }
  }

  const handleConfirm = async (fixtureId: string) => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/fixtures/${fixtureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      })
      if (!res.ok) return
      fetchLeague()
    } catch {}
  }

  const handleSeasonAction = async (action: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/seasons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); return }
      fetchLeague()
    } catch {}
    finally { setActionLoading(false) }
  }

  const handleJoin = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/leagues/${leagueId}/join`, { method: "POST" })
      if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); return }
      fetchLeague()
    } catch {}
    finally { setActionLoading(false) }
  }

  const handleLeave = async () => {
    if (!confirm("Leave this league?")) return
    setActionLoading(true)
    try {
      await fetch(`/api/leagues/${leagueId}/leave`, { method: "POST" })
      fetchLeague()
    } catch {}
    finally { setActionLoading(false) }
  }

  if (loading) return <LeagueSkeleton />
  if (error || !league) return <LeagueError error={error} />

  return (
    <div className="broadcast-theme min-h-screen bc-grain pb-28">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <button onClick={() => router.push("/leagues")} className="text-xs text-muted-soft hover:text-ink mb-4 flex items-center gap-1">
          ← All Leagues
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="bc-headline text-2xl sm:text-3xl text-ink">{league.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                league.status === "ACTIVE" ? "text-accent border-accent/16 bg-accent/8" :
                league.status === "REGISTRATION" ? "text-cyan border-cyan/20 bg-cyan/8" :
                league.status === "COMPLETED" ? "text-gold border-gold/20 bg-gold/8" : ""
              }`}>
                {league.status}
              </span>
            </div>
            <p className="text-xs text-muted-soft mt-1 font-mono">
              {league.type} · S{league.season?.number ?? 1} · {league.participantCount}/{league.maxPlayers} players
            </p>
            {league.description && <p className="text-xs text-muted mt-2 max-w-lg">{league.description}</p>}
          </div>

          <div className="shrink-0 flex gap-2">
            {isParticipant ? (
              <button onClick={handleLeave} disabled={actionLoading}
                className="px-4 py-2 rounded-[12px] text-xs font-bold text-red transition-all"
                style={{ border: "1px solid rgba(255,50,50,0.15)", background: "rgba(255,50,50,0.06)" }}>
                Leave
              </button>
            ) : league.status !== "COMPLETED" && (
              <button onClick={handleJoin} disabled={actionLoading}
                className="px-5 py-2.5 rounded-[12px] text-xs font-bold text-black transition-all hover:scale-[1.04]"
                style={{ background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.2)" }}>
                Join
              </button>
            )}
          </div>
        </div>

        {league.inviteCode && (
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono" style={{ color: "var(--accent)" }}>
            <span>Invite Code:</span>
            <span className="font-bold tracking-wider bg-accent/10 px-2.5 py-1 rounded-lg">{league.inviteCode}</span>
          </div>
        )}

        <div className="flex gap-1 mt-6 p-1 rounded-[16px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          {["Standings", "Fixtures"].map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`relative flex-1 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === i ? "text-black" : "text-muted-soft hover:text-ink"
              }`}
              style={activeTab === i ? { background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.2)" } : {}}>
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {activeTab === 0 && (
              <div className="mt-4">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-3">
                  Season {league.season?.number ?? 1} Standings
                </p>
                {standings.length === 0 ? (
                  <p className="text-sm text-muted py-8 text-center">No participants yet</p>
                ) : (
                  <div className="space-y-1">
                    {standings.map((row, i) => (
                      <Link key={row.userId} href={`/player/${row.username}`}
                        className="flex items-center gap-3 p-3 rounded-[16px] transition-all duration-200 hover:bg-white/[0.02]"
                        style={{ border: "1px solid rgba(255,255,255,0.03)" }}
                      >
                        <span className={`font-mono text-sm font-bold w-7 text-center tabular-nums ${
                          i === 0 ? "text-gold" : i <= 2 ? "text-muted-soft" : "text-muted-faint"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="h-8 w-8 rounded-[10px] flex items-center justify-center text-xs font-bold overflow-hidden shrink-0"
                          style={{ background: row.avatarUrl ? `url(${row.avatarUrl}) center/cover` : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))", border: "1px solid rgba(255,255,255,0.06)" }}>
                          {!row.avatarUrl && <span className="text-accent">{(row.displayName || row.username)[0]}</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-ink truncate block">{row.displayName || row.username}</span>
                          <div className="flex gap-1.5 mt-0.5">
                            {row.form.split("").slice(-5).map((r, fi) => (
                              <span key={fi} className={`inline-block w-3.5 h-3.5 rounded-[3px] text-[7px] font-bold text-center leading-[14px] ${
                                r === "W" ? "text-accent" : r === "L" ? "text-red" : "text-muted-faint"
                              }`} style={{
                                background: r === "W" ? "rgba(0,255,133,0.12)" : r === "L" ? "rgba(255,50,50,0.12)" : "rgba(255,255,255,0.04)",
                              }}>{r}</span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-lg font-bold tabular-nums text-ink">{row.points}</p>
                          <p className="text-[9px] text-muted-faint font-mono">{row.played}P · {row.wins}W · {row.losses}L · {row.draws}D</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 1 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
                    Matchday {selectedMatchday} of {totalMatchdays || "?"}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedMatchday(Math.max(1, selectedMatchday - 1))}
                      disabled={selectedMatchday <= 1}
                      className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.04)" }}>←</button>
                    <button onClick={() => setSelectedMatchday(Math.min(totalMatchdays, selectedMatchday + 1))}
                      disabled={selectedMatchday >= totalMatchdays}
                      className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold disabled:opacity-30"
                      style={{ background: "rgba(255,255,255,0.04)" }}>→</button>
                  </div>
                </div>

                {matchday?.matches.length === 0 || !matchday ? (
                  <p className="text-sm text-muted py-8 text-center">No fixtures for this matchday</p>
                ) : (
                  <div className="space-y-2">
                    {matchday?.matches.map((f) => {
                      const homeName = f.homePlayer.displayName || f.homePlayer.username
                      const awayName = f.awayPlayer.displayName || f.awayPlayer.username
                      const isParticipant = f.homePlayerId === session?.userId || f.awayPlayerId === session?.userId
                      const scoreStr = f.homeScore !== null ? `${f.homeScore} - ${f.awayScore}` : "vs"
                      const isPlayed = f.status === "PLAYED" || f.status === "CONFIRMED"
                      const needsConfirm = f.status === "PLAYED" && isParticipant

                      return (
                        <div key={f.id} className="flex items-center justify-between p-4 rounded-[18px] transition-all"
                          style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs text-muted-faint font-mono w-5 text-right truncate">{homeName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {isPlayed ? (
                              <button onClick={() => needsConfirm ? handleConfirm(f.id) : null}
                                className={`font-mono text-base font-bold tabular-nums px-4 py-1.5 rounded-[10px] ${
                                  needsConfirm ? "hover:bg-accent/10 cursor-pointer" : ""
                                }`}
                                style={{
                                  background: f.status === "CONFIRMED" ? "rgba(0,255,133,0.06)" : "rgba(255,255,255,0.04)",
                                  color: f.status === "CONFIRMED" ? "var(--accent)" : "var(--ink)",
                                  border: needsConfirm ? "1px solid rgba(0,255,133,0.15)" : "1px solid transparent",
                                }}>
                                {f.homeScore} - {f.awayScore}
                                {needsConfirm && <span className="block text-[8px] font-mono text-accent">Confirm</span>}
                              </button>
                            ) : (
                              <button onClick={() => {
                                setHomeScore(""); setAwayScore("")
                                setScoreModal({ fixture: f })
                              }} disabled={!isParticipant && !isAdmin}
                                className="font-mono text-sm tabular-nums px-4 py-1.5 rounded-[10px] text-muted-faint disabled:opacity-40"
                                style={{ background: "rgba(255,255,255,0.03)" }}>
                                {isParticipant || isAdmin ? "Submit" : "vs"}
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
                            <span className="text-xs text-muted-faint font-mono w-5 text-left truncate">{awayName}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {isAdmin && league.status === "REGISTRATION" && totalMatchdays === 0 && (
                  <button onClick={() => handleSeasonAction("start")} disabled={actionLoading}
                    className="w-full mt-4 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                    style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}>
                    {actionLoading ? "Starting..." : "Start Season & Generate Fixtures"}
                  </button>
                )}

                {isAdmin && league.status === "ACTIVE" && (
                  <button onClick={() => handleSeasonAction("end")} disabled={actionLoading}
                    className="w-full mt-4 py-3 rounded-[14px] text-sm font-bold text-red"
                    style={{ border: "1px solid rgba(255,50,50,0.15)", background: "rgba(255,50,50,0.06)" }}>
                    End Season
                  </button>
                )}

                {isAdmin && league.status === "COMPLETED" && (
                  <button onClick={() => handleSeasonAction("new_season")} disabled={actionLoading}
                    className="w-full mt-4 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                    style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}>
                    New Season
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Score Modal */}
        <AnimatePresence>
          {scoreModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setScoreModal(null)}>
              <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} exit={{ scale: 0.92 }}
                className="w-full max-w-xs rounded-[24px] p-6" onClick={(e) => e.stopPropagation()}
                style={{ background: "rgba(14,16,20,0.96)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-lg font-bold text-ink text-center">Submit Score</h3>
                <p className="text-xs text-muted text-center mt-1 font-mono">
                  {scoreModal.fixture.homePlayer.displayName || scoreModal.fixture.homePlayer.username} vs {scoreModal.fixture.awayPlayer.displayName || scoreModal.fixture.awayPlayer.username}
                </p>
                <div className="flex items-center justify-center gap-4 mt-5">
                  <input type="number" min="0" max="50" value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
                    className="w-20 text-center py-3 rounded-[14px] text-2xl font-bold text-ink outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    placeholder="0" />
                  <span className="text-xl text-muted-faint font-bold">:</span>
                  <input type="number" min="0" max="50" value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
                    className="w-20 text-center py-3 rounded-[14px] text-2xl font-bold text-ink outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    placeholder="0" />
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setScoreModal(null)} className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft"
                    style={{ background: "rgba(255,255,255,0.04)" }}>Cancel</button>
                  <button onClick={handleSubmitScore} disabled={scoreLoading || !homeScore || !awayScore}
                    className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                    style={{ background: "var(--accent)" }}>
                    {scoreLoading ? "..." : "Submit"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function LeagueSkeleton() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain animate-pulse">
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <div className="h-4 w-20 bg-white/5 rounded mb-6" />
        <div className="h-8 w-48 bg-white/5 rounded mb-2" />
        <div className="h-4 w-32 bg-white/3 rounded mb-8" />
        <div className="space-y-2">{[1,2,3,4,5,6].map((i) => <div key={i} className="h-14 rounded-[16px] bg-white/3" />)}</div>
      </div>
    </div>
  )
}

function LeagueError({ error }: { error: string | null }) {
  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-5xl">🏟️</p>
        <p className="text-lg text-ink font-bold">{error || "Not found"}</p>
        <Link href="/leagues" className="inline-flex px-5 py-2.5 rounded-[14px] text-sm font-bold text-black"
          style={{ background: "var(--accent)" }}>Browse Leagues</Link>
      </div>
    </div>
  )
}
