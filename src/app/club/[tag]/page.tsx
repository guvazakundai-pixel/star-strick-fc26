"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "@/lib/session-client"

type ClubData = {
  id: string
  name: string
  slug: string
  tag: string
  tagline: string
  description: string
  logoUrl: string | null
  bannerUrl: string | null
  city: string
  country: string
  isVerified: boolean
  membersInviteOnly: boolean
  isPublic: boolean
  joinCode: string
  clubXp: number
  winRate: number
  momentum: number
  featuredLegends: string[]
  trophies: string[]
  createdAt: string
  manager: { id: string; username: string; displayName: string; avatarUrl: string | null }
  globalRank: {
    rankPosition: number
    prevPosition: number
    totalPoints: number
    wins: number
    losses: number
    draws: number
    played: number
    goalsFor: number
    goalsAgainst: number
    momentum: number
  } | null
  memberCount: number
  achievementCount: number
  activityCount: number
}

type Member = {
  id: string
  role: string
  title: string | null
  clubXp: number
  status: string
  joinedAt: string
  user: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    country: string
    stats: { points: number; wins: number; losses: number; draws: number; skillRating: number; winStreak: number } | null
    playerRanking: { rankPosition: number } | null
  }
}

type Achievement = {
  id: string
  title: string
  description: string | null
  icon: string
  earnedAt: string
}

type Activity = {
  id: string
  type: string
  message: string
  metadata: any
  createdAt: string
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
}

type Rival = {
  clubId: string
  name: string
  slug: string
  tag: string
  logoUrl: string | null
  clubXp: number
  rank: number
  ourWins: number
  theirWins: number
  draws: number
}

type MatchBrief = {
  id: string
  score1: number
  score2: number
  player1: { id: string; username: string; displayName: string | null }
  player2: { id: string; username: string; displayName: string | null }
  winner: { id: string; username: string; displayName: string | null } | null
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "text-gold border-gold/20 bg-gold/8",
  MANAGER: "text-accent border-accent/16 bg-accent/8",
  CAPTAIN: "text-purple border-purple/20 bg-purple/10",
  LEGEND: "text-gold border-gold/20 bg-gold/8",
  PRO: "text-cyan border-cyan/20 bg-cyan/10",
  MEMBER: "text-muted-faint border-white/5 bg-white/[0.03]",
  RECRUIT: "text-muted-faint/60 border-white/3 bg-white/[0.02]",
}

export default function ClubDetailPage() {
  const params = useParams()
  const tag = params?.tag as string
  const session = useSession()

  const [club, setClub] = useState<ClubData | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [rivals, setRivals] = useState<Rival[]>([])
  const [recentMatches, setRecentMatches] = useState<MatchBrief[]>([])
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  const fetchClub = useCallback(async () => {
    try {
      const res = await fetch(`/api/clubs?q=${tag}`)
      const data = await res.json()
      const found = data.clubs?.find((c: any) => c.slug === tag || c.tag === tag.toUpperCase())
      if (!found) { setError("Club not found"); return }

      const detailRes = await fetch(`/api/clubs/${found.id}`)
      const detail = await detailRes.json()
      setClub(detail.club)
      setMembers(detail.members ?? [])
      setAchievements(detail.achievements ?? [])
      setActivity(detail.recentActivity ?? [])
      setRivals(detail.rivals ?? [])
      setRecentMatches(detail.recentMatches ?? [])
    } catch { setError("Failed to load club") }
    finally { setLoading(false) }
  }, [tag])

  useEffect(() => { fetchClub() }, [fetchClub])

  const handleJoin = async () => {
    setJoinLoading(true)
    setJoinError(null)
    try {
      const body: any = { clubId: club!.id }
      if (joinCode) body.code = joinCode
      const res = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setJoinError(err.error || "Failed to join")
        return
      }
      setJoined(true)
      setShowJoinModal(false)
      fetchClub()
    } catch { setJoinError("Something went wrong") }
    finally { setJoinLoading(false) }
  }

  if (loading) return <ClubSkeleton />
  if (error || !club) return <ClubError error={error} />

  const isMember = members.some((m) => m.user.id === session?.userId)

  return (
    <div className="broadcast-theme min-h-screen bc-grain pb-28">
      <ClubBanner club={club} />

      <div className="mx-auto max-w-4xl px-4 -mt-16 relative z-20">
        <ClubHeader
          club={club}
          isMember={isMember || joined}
          onJoinClick={() => { if (!session) return; setShowJoinModal(true) }}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <StatCard label="Rank" value={club.globalRank ? `#${club.globalRank.rankPosition}` : "—"} accent rank={club.globalRank?.rankPosition} />
          <StatCard label="Club XP" value={club.clubXp.toLocaleString()} />
          <StatCard label="Win Rate" value={`${club.winRate}%`} accent={club.winRate >= 60} />
          <StatCard label="Members" value={club.memberCount} />
        </div>

        <div className="flex gap-1 mt-6 p-1 rounded-[16px]" style={{ background: "rgba(255,255,255,0.03)" }}>
          {["Overview", "Roster", "Activity"].map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`relative flex-1 py-2.5 rounded-[12px] text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === i ? "text-black" : "text-muted-soft hover:text-ink"
              }`}
              style={activeTab === i ? { background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.2)" } : {}}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 0 && (
              <OverviewTab club={club} achievements={achievements} rivals={rivals} recentMatches={recentMatches} activity={activity} />
            )}
            {activeTab === 1 && <RosterTab members={members} />}
            {activeTab === 2 && <ActivityTab activity={activity} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[24px] p-6"
              style={{ background: "rgba(14,16,20,0.96)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-ink">Join {club.name}</h3>
              <p className="text-sm text-muted mt-1">Enter invite code or join directly</p>
              {joinError && <p className="text-xs text-red mt-3 bg-red/10 rounded-xl px-3 py-2">{joinError}</p>}
              {club.membersInviteOnly && (
                <div className="mt-4">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Invite Code</label>
                  <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Enter code"
                    className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                </div>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowJoinModal(false)} className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft" style={{ background: "rgba(255,255,255,0.04)" }}>
                  Cancel
                </button>
                <button onClick={handleJoin} disabled={joinLoading}
                  className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                  style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
                >
                  {joinLoading ? "Joining..." : club.membersInviteOnly ? "Apply" : "Join"}
                </button>
              </div>
              {club.joinCode && (
                <p className="text-center text-[10px] text-muted-faint mt-4 font-mono">
                  Code: <span className="text-accent font-bold">{club.joinCode}</span>
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ClubBanner({ club }: { club: ClubData }) {
  return (
    <div className="relative overflow-hidden" style={{ height: "280px" }}>
      <div className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: club.bannerUrl ? `url(${club.bannerUrl})` : "linear-gradient(135deg, #0D0D0F, #1a1040 40%, #0a1628 70%, #0D0D0F)" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/30 to-transparent" />
    </div>
  )
}

function ClubHeader({ club, isMember, onJoinClick }: { club: ClubData; isMember: boolean; onJoinClick: () => void }) {
  return (
    <div className="flex items-end gap-4">
      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[20px] border-2 border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0"
        style={{ background: club.logoUrl ? `url(${club.logoUrl}) center/cover` : "linear-gradient(135deg, rgba(22,24,28,0.95), rgba(18,20,24,0.85))", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
      >
        {!club.logoUrl && <span className="bc-headline text-3xl sm:text-4xl text-accent">{club.tag?.[0] ?? club.name[0]}</span>}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="bc-headline text-2xl sm:text-3xl text-ink">{club.name}</h1>
          {club.isVerified && <span className="pill-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Verified</span>}
          {club.globalRank && club.globalRank.rankPosition <= 3 && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,215,0,0.10)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.15)" }}
            >#{club.globalRank.rankPosition}</span>
          )}
        </div>
        <p className="font-mono text-[11px] text-muted-soft mt-0.5">[{club.tag}] · {club.city}, {club.country}</p>
        {club.tagline && <p className="text-xs text-muted mt-1 max-w-lg italic">&ldquo;{club.tagline}&rdquo;</p>}
      </div>
      <div className="shrink-0 pb-1">
        {!isMember ? (
          <button onClick={onJoinClick}
            className="px-5 py-2.5 rounded-[14px] text-sm font-bold text-black transition-all duration-200 hover:scale-[1.04]"
            style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
          >Join Club</button>
        ) : (
          <span className="inline-flex items-center px-4 py-2 rounded-[14px] text-sm font-bold"
            style={{ background: "rgba(0,255,133,0.08)", color: "var(--accent)", border: "1px solid rgba(0,255,133,0.12)" }}
          >Member</span>
        )}
      </div>
    </div>
  )
}

function OverviewTab({ club, achievements, rivals, recentMatches, activity }: {
  club: ClubData; achievements: Achievement[]; rivals: Rival[]; recentMatches: MatchBrief[]; activity: Activity[]
}) {
  return (
    <div className="mt-5 space-y-5">
      {club.description && (
        <Section title="About">
          <p className="text-sm text-muted leading-relaxed">{club.description}</p>
          {club.featuredLegends.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold/70">Featured Legends:</span>
              {club.featuredLegends.map((legend) => (
                <span key={legend} className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "rgba(255,215,0,0.08)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.10)" }}
                >{legend}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {club.globalRank && club.globalRank.played > 0 && (
        <Section title="Record">
          <div className="flex flex-wrap gap-3 text-sm font-mono">
            <span>Played: <strong className="text-ink">{club.globalRank.played}</strong></span>
            <span style={{ color: "var(--accent)" }}>W: <strong>{club.globalRank.wins}</strong></span>
            <span>D: <strong className="text-ink">{club.globalRank.draws}</strong></span>
            <span style={{ color: "#f87171" }}>L: <strong>{club.globalRank.losses}</strong></span>
            <span>GF: <strong className="text-ink">{club.globalRank.goalsFor}</strong></span>
            <span>GA: <strong className="text-ink">{club.globalRank.goalsAgainst}</strong></span>
            <span>GD: <strong className="text-ink">{club.globalRank.goalsFor - club.globalRank.goalsAgainst >= 0 ? `+${club.globalRank.goalsFor - club.globalRank.goalsAgainst}` : club.globalRank.goalsFor - club.globalRank.goalsAgainst}</strong></span>
          </div>
        </Section>
      )}

      {rivals.length > 0 && (
        <Section title="Rivalries">
          <div className="space-y-3">
            {rivals.map((rival) => (
              <Link key={rival.clubId} href={`/club/${rival.slug}`}
                className="flex items-center justify-between p-4 rounded-[18px] transition-all duration-200 hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, rgba(255,50,50,0.04), rgba(168,85,247,0.04))", border: "1px solid rgba(255,50,50,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-[12px] flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >{rival.tag?.[0] ?? rival.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-ink">{rival.name}</p>
                    <p className="font-mono text-[10px] text-muted-faint">#{rival.rank} · {rival.clubXp.toLocaleString()} XP</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-mono tabular-nums">
                    <span className="text-accent font-bold">{rival.ourWins}</span>
                    <span className="text-muted-faint">-</span>
                    <span className="text-red font-bold">{rival.theirWins}</span>
                  </div>
                  <p className="text-[10px] text-muted-faint">{rival.draws} draws</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-[16px]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{a.title}</p>
                  {a.description && <p className="text-xs text-muted mt-0.5">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {recentMatches.length > 0 && (
        <Section title="Recent Matches">
          <div className="space-y-2">
            {recentMatches.map((m) => {
              const p1Name = m.player1.displayName || m.player1.username
              const p2Name = m.player2.displayName || m.player2.username
              const isP1Win = m.winnerId === m.player1.id
              return (
                <Link key={m.id} href={`/matches/${m.id}`}
                  className="flex items-center justify-between p-3.5 rounded-[16px]"
                  style={{ border: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <span className={`text-xs font-medium truncate max-w-[30%] ${isP1Win ? "text-accent" : "text-ink"}`}>{p1Name}</span>
                  <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
                    <span className={isP1Win ? "text-accent" : "text-ink"}>{m.score1}</span>
                    <span className="text-muted-faint">:</span>
                    <span className={!isP1Win && m.winnerId ? "text-accent" : "text-ink"}>{m.score2}</span>
                  </div>
                  <span className={`text-xs font-medium truncate max-w-[30%] text-right ${!isP1Win && m.winnerId ? "text-accent" : "text-ink"}`}>{p2Name}</span>
                </Link>
              )
            })}
          </div>
        </Section>
      )}

      {activity.length > 0 && (
        <Section title="Recent Activity">
          <div className="space-y-2">
            {activity.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 rounded-[14px]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
                <ActivityIcon type={act.type} />
                <div className="min-w-0">
                  <p className="text-sm text-ink">{act.message}</p>
                  <p className="text-[10px] text-muted-faint font-mono mt-0.5">{act.user.displayName || act.user.username} · {timeAgo(act.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function RosterTab({ members }: { members: Member[] }) {
  if (members.length === 0) return <div className="mt-8 text-center"><p className="text-sm text-muted">No members yet</p></div>
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{members.length} Member{members.length !== 1 ? "s" : ""}</p>
        <p className="font-mono text-[10px] text-muted-faint">Internal XP Ranking</p>
      </div>
      <div className="space-y-1.5">
        {members.map((m, i) => (
          <Link key={m.id} href={`/player/${m.user.username}`}
            className="flex items-center gap-3.5 p-3.5 rounded-[18px] transition-all duration-200 hover:bg-white/[0.02]"
            style={{ border: "1px solid rgba(255,255,255,0.03)" }}
          >
            <span className="font-mono text-xs text-muted-faint w-6 text-right tabular-nums">#{i + 1}</span>
            <div className="h-10 w-10 rounded-[12px] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0"
              style={{ background: m.user.avatarUrl ? `url(${m.user.avatarUrl}) center/cover` : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {!m.user.avatarUrl && <span className="text-accent">{(m.user.displayName || m.user.username)[0].toUpperCase()}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-ink truncate">{m.user.displayName || m.user.username}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${ROLE_COLORS[m.role] || ROLE_COLORS.MEMBER}`}>{m.role}</span>
                {m.title && <span className="text-[9px] text-muted-faint italic">&ldquo;{m.title}&rdquo;</span>}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-faint mt-0.5">
                <span>{m.clubXp.toLocaleString()} XP</span>
                {m.user.stats && <span>{m.user.stats.wins}W · {m.user.stats.losses}L</span>}
                {m.user.playerRanking && <span>#{m.user.playerRanking.rankPosition} Global</span>}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-mono text-lg font-bold tabular-nums text-ink">{m.clubXp}</p>
              <p className="text-[9px] text-muted-faint">pts</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function ActivityTab({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) return <div className="mt-8 text-center"><p className="text-sm text-muted">No activity yet</p></div>
  return (
    <div className="mt-5 space-y-2">
      {activity.map((act) => (
        <div key={act.id} className="flex items-start gap-3.5 p-4 rounded-[18px]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
          <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
            <ActivityIcon type={act.type} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-ink">{act.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-faint">{act.user.displayName || act.user.username}</span>
              <span className="text-muted-faint">·</span>
              <span className="text-xs text-muted-faint font-mono">{timeAgo(act.createdAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    MATCH_RESULT: "⚔️", NEW_SIGNING: "📝", TOURNAMENT_WIN: "🏆", RIVALRY_UPDATE: "🔥",
    ANNOUNCEMENT: "📢", MVP_HIGHLIGHT: "⭐", ACHIEVEMENT: "🎖️", MEMBER_JOINED: "👋", CLUB_CREATED: "✨",
  }
  return <span className="text-base">{icons[type] || "📌"}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] p-5" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-3">{title}</h2>
      {children}
    </section>
  )
}

function StatCard({ label, value, accent, rank }: { label: string; value: number | string; accent?: boolean; rank?: number }) {
  const getStyle = () => {
    if (rank === 1) return { color: "#ffd700", boxShadow: "0 2px 16px rgba(255,215,0,0.15)" }
    if (rank === 2) return { color: "#648cff", boxShadow: "0 2px 16px rgba(100,140,255,0.15)" }
    if (rank === 3) return { color: "#cd7f32", boxShadow: "0 2px 16px rgba(205,127,50,0.15)" }
    return {}
  }
  return (
    <div className="p-3.5 rounded-[20px] transition-all duration-300 hover:scale-[1.02]"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", ...getStyle() }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={`bc-headline text-2xl mt-1 tabular-nums ${accent ? "text-accent" : "text-ink"}`}
        style={rank && rank <= 3 ? { color: getStyle().color } : {}}
      >{value}</p>
    </div>
  )
}

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  return `${Math.floor(day / 30)}mo ago`
}

function ClubSkeleton() {
  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="animate-pulse" style={{ height: "280px", background: "rgba(255,255,255,0.02)" }} />
      <div className="mx-auto max-w-4xl px-4 -mt-16 relative z-20">
        <div className="flex items-end gap-4">
          <div className="h-24 w-24 rounded-[20px] bg-white/5" />
          <div className="flex-1 pb-1 space-y-2">
            <div className="h-7 w-48 rounded-md bg-white/5" />
            <div className="h-4 w-32 rounded-md bg-white/3" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 rounded-[20px] bg-white/3" />)}
        </div>
      </div>
    </div>
  )
}

function ClubError({ error }: { error: string | null }) {
  return (
    <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-5xl">🏟️</p>
        <p className="text-lg text-ink font-bold">{error || "Club not found"}</p>
        <Link href="/clubs" className="inline-flex px-5 py-2.5 rounded-[14px] text-sm font-bold text-black" style={{ background: "var(--accent)" }}>
          Browse Clubs
        </Link>
      </div>
    </div>
  )
}
