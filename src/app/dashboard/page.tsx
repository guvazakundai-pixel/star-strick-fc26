"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.user?.playerStats) setStats(data.user.playerStats)
        })
    }
  }, [user])

  if (authLoading || !user) return <LoadingSkeleton />

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="bc-headline text-3xl sm:text-4xl text-white">Dashboard</h1>
            <p className="text-white/50 text-sm mt-1">Welcome back, {user.username}</p>
          </div>
          <button
            onClick={async () => {
              await logout()
              router.push("/login")
            }}
            className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-sm text-white/60 hover:border-red-500 hover:text-red-400 transition"
          >
            Sign Out
          </button>
        </div>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Your Profile</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Username" value={user.username} />
            <Stat label="Role" value={user.role} />
            <Stat label="Member Since" value={new Date().toLocaleDateString()} />
            <Stat label="Status" value="Active" tone="neon" />
          </div>
        </div>

        {user.role === "PLAYER" && <PlayerDashboard stats={stats} />}
        {user.role === "MANAGER" && <ManagerDashboard />}
        {user.role === "ADMIN" && <AdminDashboard />}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "neon" }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-lg font-mono font-bold ${tone === "neon" ? "text-[#00ff85]" : "text-white"}`}>{value}</p>
    </div>
  )
}

function PlayerDashboard({ stats }: { stats: Record<string, unknown> | null }) {
  const [clubs, setClubs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => setClubs(data.clubs ?? []))
      .catch(() => setError("Failed to load clubs"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {stats && (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Player Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <Stat label="Matches" value={String(stats.matchesPlayed ?? 0)} />
            <Stat label="Wins" value={String(stats.wins ?? 0)} tone="neon" />
            <Stat label="Losses" value={String(stats.losses ?? 0)} />
            <Stat label="Draws" value={String(stats.draws ?? 0)} />
            <Stat label="Goals" value={String(stats.goalsScored ?? 0)} tone="neon" />
          </div>
        </div>
      )}

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Browse Clubs</h2>
        {loading ? (
          <p className="text-white/40 text-sm">Loading...</p>
        ) : error ? (
          <p className="text-red-400 text-sm">{error}</p>
        ) : clubs.length === 0 ? (
          <p className="text-white/40 text-sm">No clubs yet</p>
        ) : (
          <div className="space-y-2">
            {clubs.map((club: Record<string, unknown>) => (
              <a
                key={club.id as string}
                href={`/clubs/${club.slug}`}
                className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3 hover:border-[#00ff85] transition group"
              >
                <div>
                  <p className="text-white font-bold group-hover:text-[#00ff85] transition">{club.name as string}</p>
                  <p className="text-xs text-white/40">{club.city as string}</p>
                </div>
                <span className="text-xs text-white/30">View →</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Want to Manage a Club?</h2>
        <p className="text-white/50 text-sm mb-4">
          Apply to become a club manager and create your own team.
        </p>
        <a
          href="/manager/apply"
          className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition"
        >
          Apply Now
        </a>
      </div>
    </>
  )
}

function ManagerDashboard() {
  const [club, setClub] = useState<Record<string, unknown> | null>(null)
  const [members, setMembers] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then(async (data) => {
        const myClub = (data.clubs ?? []).find((c: Record<string, unknown>) => c.manager)
        if (myClub) {
          setClub(myClub)
          const res = await fetch(`/api/clubs/${myClub.id}/members`)
          const memData = await res.json()
          setMembers(memData.members ?? [])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-white/40">Loading...</p>

  if (!club) {
    return (
      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Create Your Club</h2>
        <p className="text-white/50 text-sm mb-4">You haven&apos;t created a club yet.</p>
        <a href="/manager/create" className="inline-flex h-10 items-center justify-center rounded-sm bg-[#00ff85] px-6 text-sm font-black tracking-[0.15em] text-[#050505] hover:bg-white transition">
          Create Club
        </a>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{club.name as string}</h2>
            <p className="text-sm text-white/40">{club.city as string}</p>
          </div>
          <a href={`/clubs/${club.slug}`} className="text-sm text-[#00ff85] hover:underline">View Public Page →</a>
        </div>
      </div>

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Members ({members.length})</h2>
        {members.length === 0 ? (
          <p className="text-white/40 text-sm">No members yet</p>
        ) : (
          <div className="space-y-2">
            {members.map((m: Record<string, unknown>) => {
              const u = m.user as Record<string, unknown> | undefined
              return (
                <div key={m.id as string} className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-2">
                  <span className="text-white text-sm">{u?.username ?? "Unknown"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-sm ${m.status === "APPROVED" ? "bg-[#00ff85]/10 text-[#00ff85]" : m.status === "PENDING" ? "bg-yellow-500/10 text-yellow-400" : "bg-red-500/10 text-red-400"}`}>
                    {m.status as string}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/manager/edit" className="h-10 inline-flex items-center justify-center rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-sm text-white hover:border-[#00ff85] transition">Edit Club</a>
          <a href="/manager/rankings" className="h-10 inline-flex items-center justify-center rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-sm text-white hover:border-[#00ff85] transition">Rankings</a>
          <a href="/manager/media" className="h-10 inline-flex items-center justify-center rounded-sm border border-[#1a1a1a] bg-[#111] px-4 text-sm text-white hover:border-[#00ff85] transition">Media</a>
        </div>
      </div>
    </>
  )
}

function AdminDashboard() {
  const [applications, setApplications] = useState<Record<string, unknown>[]>([])
  const [clubs, setClubs] = useState<Record<string, unknown>[]>([])
  const [tab, setTab] = useState<"applications" | "clubs">("applications")

  useEffect(() => {
    fetch("/api/admin?type=applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
    fetch("/api/admin?type=clubs")
      .then((r) => r.json())
      .then((data) => setClubs(data.clubs ?? []))
  }, [])

  const handleReview = async (appId: string, status: "APPROVED" | "REJECTED") => {
    await fetch(`/api/admin/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setApplications((prev) => prev.filter((a) => a.id !== appId))
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={() => setTab("applications")}
          className={`h-10 px-4 text-sm rounded-sm transition ${tab === "applications" ? "bg-[#00ff85] text-[#050505] font-bold" : "border border-[#1a1a1a] bg-[#0a0a0a] text-white/60"}`}
        >
          Applications ({applications.filter((a) => a.status === "PENDING").length})
        </button>
        <button
          onClick={() => setTab("clubs")}
          className={`h-10 px-4 text-sm rounded-sm transition ${tab === "clubs" ? "bg-[#00ff85] text-[#050505] font-bold" : "border border-[#1a1a1a] bg-[#0a0a0a] text-white/60"}`}
        >
          Clubs ({clubs.length})
        </button>
      </div>

      {tab === "applications" && (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4 space-y-3">
          {applications.filter((a) => a.status === "PENDING").length === 0 ? (
            <p className="text-white/40 text-sm">No pending applications</p>
          ) : (
            applications.filter((a) => a.status === "PENDING").map((app) => {
              const u = app.user as Record<string, unknown> | undefined
              return (
                <div key={app.id as string} className="rounded-sm border border-[#1a1a1a] bg-[#111] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold">{u?.username as string}</p>
                      <p className="text-xs text-white/40">{app.clubNameRequested as string}</p>
                      <p className="text-sm text-white/60 mt-2">{app.description as string}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(app.id as string, "APPROVED")}
                        className="h-8 px-3 rounded-sm bg-[#00ff85] text-[#050505] text-xs font-bold hover:bg-white transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(app.id as string, "REJECTED")}
                        className="h-8 px-3 rounded-sm border border-red-500 text-red-400 text-xs font-bold hover:bg-red-500/10 transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === "clubs" && (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4 space-y-2">
          {clubs.map((club) => {
            const m = club.manager as Record<string, unknown> | undefined
            return (
              <div key={club.id as string} className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3">
                <div>
                  <p className="text-white font-bold">{club.name as string}</p>
                  <p className="text-xs text-white/40">{m?.username as string} · {(club._count as Record<string, unknown>)?.members ?? 0} members</p>
                </div>
                <a href={`/clubs/${club.slug}`} className="text-xs text-[#00ff85] hover:underline">View →</a>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function LoadingSkeleton() {
  return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center">
      <p className="text-white/40">Loading...</p>
    </div>
  )
}
