"use client"

import { useEffect, useState } from "react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    totalMatches: 0,
    pendingReports: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/health")
      .then((r) => r.json())
      .then((data) => {
        const m = data.metrics ?? {}
        setStats({
          totalUsers: m.totalUsers ?? 0,
          totalClubs: m.totalClubs ?? 0,
          totalMatches: m.totalMatches ?? 0,
          pendingReports: m.pendingReports ?? 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-white/40">Loading dashboard...</p></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-white/50 mt-1">System overview and governance controls</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Users" value={String(stats.totalUsers)} tone="neon" />
        <StatCard label="Total Clubs" value={String(stats.totalClubs)} tone="gold" />
        <StatCard label="Open Reports" value={String(stats.pendingReports)} tone="danger" />
        <StatCard label="Total Matches" value={String(stats.totalMatches)} tone="neon" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction href="/admin/users" label="Manage Users" desc="View and manage all users" />
            <QuickAction href="/admin/points" label="Award Points" desc="Manually award or deduct points" />
            <QuickAction href="/admin/members" label="Club Members" desc="Approve, reject, promote members" />
            <QuickAction href="/admin/rankings" label="Club Rankings" desc="Reorder internal club rankings" />
          </div>
        </div>

        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">System Status</h3>
          <div className="space-y-3">
            <HealthMetric label="Users" value={stats.totalUsers} max={1000} />
            <HealthMetric label="Clubs" value={stats.totalClubs} max={100} />
            <HealthMetric label="Matches" value={stats.totalMatches} max={500} />
            <HealthMetric label="Pending Reports" value={stats.pendingReports} max={50} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const colors: Record<string, string> = {
    neon: "text-[#00ff85]",
    gold: "text-[#ffb800]",
    danger: "text-[#ff0040]",
  }
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colors[tone ?? ""] || "text-white"}`}>{value}</p>
    </div>
  )
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3 hover:border-[#00ff85]/30 transition group"
    >
      <div>
        <span className="text-white font-bold text-sm group-hover:text-[#00ff85] transition">{label}</span>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/30 group-hover:text-[#00ff85] transition">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  )
}

function HealthMetric({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-white/70">{label}</span>
        <span className="text-white/40">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? "bg-[#00ff85]" : pct > 50 ? "bg-[#ffb800]" : "bg-[#ff0040]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}