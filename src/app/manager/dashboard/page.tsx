"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "members", label: "Members", icon: "users" },
  { id: "matches", label: "Matches", icon: "flag" },
  { id: "rankings", label: "Rankings", icon: "bar-chart" },
  { id: "posts", label: "Posts & Feed", icon: "message-square" },
  { id: "media", label: "Media", icon: "image" },
  { id: "settings", label: "Settings", icon: "settings" },
]

export default function ManagerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [club, setClub] = useState<Record<string, unknown> | null>(null)
  const [members, setMembers] = useState<Record<string, unknown>[]>([])
  const [pending, setPending] = useState<Record<string, unknown>[]>([])
  const [stats, setStats] = useState({ members: 0, wins: 0, rank: 0 })
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("overview")

  useEffect(() => {
    if (!user) return
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          return Promise.all([
            fetch(`/api/clubs/${myClub.id}/members`).then((r) => r.json()),
            fetch(`/api/clubs/${myClub.id}/pending-members`).then((r) => r.json()),
          ])
        }
        return []
      })
      .then((results) => {
        if (results.length === 2) {
          const [memData, pendingData] = results
          setMembers(memData.members ?? [])
          setPending(pendingData.pending ?? [])
          setStats({
            members: (memData.members ?? []).filter((m: Record<string, unknown>) => m.status === "APPROVED").length,
            wins: 0,
            rank: 0,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>
  if (!club) return <NoClub />

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-[#111] flex items-center justify-center text-sm font-bold text-[#00ff85]">
              {(club.name as string)?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold truncate">{club.name as string}</p>
              <p className="text-xs text-white/40">{club.city as string}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition ${
                activeSection === item.id
                  ? "bg-[#00ff85]/10 text-[#00ff85]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <NavIcon name={item.icon} />
              {item.label}
              {item.id === "members" && pending.length > 0 && (
                <span className="ml-auto h-5 px-1.5 rounded-full bg-[#ffb800]/20 text-[#ffb800] text-xs flex items-center justify-center">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1a1a1a]">
          <Link href={`/clubs/${club.slug}`} className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View Public Page
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <SectionContent
              section={activeSection}
              club={club}
              members={members}
              pending={pending}
              stats={stats}
              onAction={(type, data) => {
                if (type === "approve") {
                  handleMemberAction(club.id as string, data.id, "APPROVED")
                } else if (type === "reject") {
                  handleMemberAction(club.id as string, data.id, "REJECTED")
                } else if (type === "promote") {
                  handleMemberAction(club.id as string, data.id, "CO_MANAGER")
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )

  async function handleMemberAction(clubId: string, memberId: string, action: string) {
    const data = action === "CO_MANAGER" ? { role: "CO_MANAGER" } : { status: action }
    const res = await fetch(`/api/clubs/${clubId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      setPending((prev) => prev.filter((m) => m.id !== memberId))
      const memRes = await fetch(`/api/clubs/${clubId}/members`)
      const memData = await memRes.json()
      setMembers(memData.members ?? [])
    }
  }
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    flag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
    "bar-chart": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    "message-square": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    image: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  }
  return icons[name] || null
}

function NoClub() {
  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">No Club Yet</h2>
        <p className="text-white/50 mb-6">Create your club to access the manager dashboard.</p>
        <Link href="/manager/create" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Create Club
        </Link>
      </div>
    </div>
  )
}

function SectionContent({ section, club, members, pending, stats, onAction }: Record<string, any>) {
  if (section === "overview") return <OverviewSection club={club} members={members} pending={pending} stats={stats} />
  if (section === "members") return <MembersSection members={members} pending={pending} onAction={onAction} />
  if (section === "matches") return <MatchesSection club={club} />
  if (section === "rankings") return <RankingsSection club={club} />
  if (section === "posts") return <PostsSection club={club} />
  if (section === "media") return <MediaSection club={club} />
  if (section === "settings") return <SettingsSection club={club} />
  return null
}

function OverviewSection({ club, members, pending, stats }: Record<string, any>) {
  const approved = (members ?? []).filter((m: Record<string, unknown>) => m.status === "APPROVED")
  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
        {club.bannerUrl ? (
          <div className="h-40 sm:h-52 relative">
            <img src={club.bannerUrl as string} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-r from-[#00ff85]/10 to-[#ffb800]/10" />
        )}
        <div className="p-4 -mt-12 relative flex items-end gap-4">
          <div className="h-20 w-20 rounded-sm border-4 border-[#0a0a0a] bg-[#111] flex items-center justify-center text-xl font-black text-[#00ff85]">
            {club.logoUrl ? <img src={club.logoUrl as string} alt="" className="w-full h-full object-cover" /> : (club.name as string)?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{club.name as string}</h1>
            <p className="text-sm text-white/50">{club.city as string}, {club.country as string}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Members" value={String(approved.length)} icon="users" />
        <StatCard label="Pending" value={String((pending ?? []).length)} icon="clock" tone="warning" />
        <StatCard label="Global Rank" value={`#${stats.rank || "—"}`} icon="trophy" tone="gold" />
        <StatCard label="Wins" value={String(stats.wins)} icon="check" tone="neon" />
      </div>

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Recent Activity</h3>
        {pending.length === 0 ? (
          <p className="text-white/30 text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {(pending ?? []).slice(0, 3).map((m: Record<string, unknown>) => {
              const u = m.user as Record<string, unknown> | undefined
              return (
                <div key={m.id as string} className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-3 py-2">
                  <span className="text-sm text-white">{u?.username as string} requested to join</span>
                  <span className="text-xs text-yellow-400">Pending</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, tone }: Record<string, string>) {
  const colors: Record<string, string> = {
    neon: "text-[#00ff85]",
    gold: "text-[#ffb800]",
    warning: "text-[#ffb800]",
  }
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colors[tone ?? ""] || "text-white"}`}>{value}</p>
    </div>
  )
}

function MembersSection({ members, pending, onAction }: Record<string, any>) {
  const approved = (members ?? []).filter((m: Record<string, unknown>) => m.status === "APPROVED")
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="rounded-sm border border-[#ffb800]/30 bg-[#ffb800]/5 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#ffb800] mb-3">Pending Requests ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map((m: Record<string, unknown>) => {
              const u = m.user as Record<string, unknown> | undefined
              return (
                <div key={m.id as string} className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3">
                  <div>
                    <span className="text-white font-bold">{u?.username as string}</span>
                    <p className="text-xs text-white/40">Requested {new Date(m.joinedAt as string).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAction("approve", { id: m.id })} className="h-7 px-3 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-xs font-bold hover:bg-[#00ff85]/20 transition">Approve</button>
                    <button onClick={() => onAction("reject", { id: m.id })} className="h-7 px-3 rounded-sm bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition">Reject</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Members ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-white/30 text-sm">No members yet</p>
        ) : (
          <div className="space-y-2">
            {approved.map((m: Record<string, unknown>) => {
              const u = m.user as Record<string, unknown> | undefined
              return (
                <div key={m.id as string} className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-sm bg-[#111] flex items-center justify-center text-xs font-bold text-white/60">
                      {u?.username ? (u.username as string).slice(0, 2).toUpperCase() : "??"}
                    </div>
                    <div>
                      <span className="text-white font-bold">{u?.username as string}</span>
                      {m.role === "CO_MANAGER" && <span className="ml-2 text-xs px-2 py-0.5 rounded-sm bg-purple-500/10 text-purple-400">Co-Manager</span>}
                    </div>
                  </div>
                  {m.role === "PLAYER" && (
                    <button onClick={() => onAction("promote", { id: m.id })} className="h-6 px-3 rounded-sm bg-purple-500/10 text-purple-400 text-xs font-bold hover:bg-purple-500/20 transition">Promote</button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function MatchesSection({ club }: Record<string, any>) {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Match Reporting</h2>
      <p className="text-white/30 text-sm">Report match results and view match history.</p>
      <div className="mt-4">
        <a href="/manager/matches" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Report Match →
        </a>
      </div>
    </div>
  )
}

function RankingsSection({ club }: Record<string, any>) {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Rankings Editor</h2>
      <p className="text-white/30 text-sm">Use drag-and-drop to reorder players and set points.</p>
      <div className="mt-4">
        <a href="/manager/rankings" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Open Rankings Editor →
        </a>
      </div>
    </div>
  )
}

function PostsSection({ club }: Record<string, any>) {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Posts & Announcements</h2>
      <p className="text-white/30 text-sm">Create announcements and feed posts for your club.</p>
      <div className="mt-4">
        <a href="/manager/posts" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Manage Posts →
        </a>
      </div>
    </div>
  )
}

function MediaSection({ club }: Record<string, any>) {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Media Gallery</h2>
      <p className="text-white/30 text-sm">Upload logos, banners, and gallery images.</p>
      <div className="mt-4">
        <a href="/manager/media" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Manage Media →
        </a>
      </div>
    </div>
  )
}

function SettingsSection({ club }: Record<string, any>) {
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Club Settings</h2>
      <p className="text-white/30 text-sm">Update club name, description, logo, and banner.</p>
      <div className="mt-4">
        <a href="/manager/edit" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Edit Settings →
        </a>
      </div>
    </div>
  )
}
