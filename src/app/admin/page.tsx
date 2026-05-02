"use client"

import { useEffect, useState } from "react"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    pendingApps: 0,
    pendingReports: 0,
    totalMatches: 0,
    activeClubs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin?type=users").then((r) => r.json()),
      fetch("/api/admin?type=clubs").then((r) => r.json()),
      fetch("/api/admin?type=applications").then((r) => r.json()),
      fetch("/api/reports?status=PENDING").then((r) => r.json()),
      fetch("/api/matches").then((r) => r.json()),
    ])
      .then(([usersData, clubsData, appsData, reportsData, matchesData]) => {
        setStats({
          totalUsers: (usersData.users ?? []).length,
          totalClubs: (clubsData.clubs ?? []).length,
          pendingApps: (appsData.applications ?? []).filter((a: Record<string, unknown>) => a.status === "PENDING").length,
          pendingReports: (reportsData.reports ?? []).length,
          totalMatches: (matchesData.matches ?? []).length,
          activeClubs: (clubsData.clubs ?? []).filter((c: Record<string, unknown>) => !c.isBanned).length,
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Users" value={String(stats.totalUsers)} tone="neon" />
        <StatCard label="Total Clubs" value={String(stats.totalClubs)} tone="gold" />
        <StatCard label="Active Clubs" value={String(stats.activeClubs)} tone="neon" />
        <StatCard label="Pending Apps" value={String(stats.pendingApps)} tone="warning" />
        <StatCard label="Open Reports" value={String(stats.pendingReports)} tone="danger" />
        <StatCard label="Total Matches" value={String(stats.totalMatches)} tone="neon" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <QuickAction href="/admin/applications" label="Review Manager Applications" desc={`${stats.pendingApps} pending`} />
            <QuickAction href="/admin/reports" label="Resolve User Reports" desc={`${stats.pendingReports} open`} />
            <QuickAction href="/admin/users" label="Manage Users" desc="View and manage all users" />
            <QuickAction href="/admin/audit-logs" label="Audit Logs" desc="System activity history" />
          </div>
        </div>

        <SystemHealth />
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const colors: Record<string, string> = {
    neon: "text-[#00ff85]",
    gold: "text-[#ffb800]",
    warning: "text-[#ffb800]",
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
      className="flex items-center justify-between rounded-sm border border-[#1a1a1a] bg-[#111] px-4 py-3 hover:border-[#ff0040]/30 transition group"
    >
      <div>
        <span className="text-white font-bold text-sm group-hover:text-[#ff0040] transition">{label}</span>
        <p className="text-xs text-white/40">{desc}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white/30 group-hover:text-[#ff0040] transition">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  )
}

function SystemHealth() {
  const [health, setHealth] = useState<Record<string, { value: number; label: string }> | null>(null)

  useEffect(() => {
    fetch("/api/admin/health")
      .then((r) => r.json())
      .then((data) => setHealth(data.metrics ?? null))
      .catch(() => {})
  }, [])

  const metrics = health ?? {
    database: { value: 100, label: "Database" },
    api: { value: 100, label: "API Latency" },
    storage: { value: 75, label: "Storage" },
  }

  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-white/50 mb-3">System Health</h3>
      <div className="space-y-4">
        {Object.entries(metrics).map(([key, metric]) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/70">{metric.label}</span>
              <span className="text-white/40">{metric.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  metric.value > 80 ? "bg-[#00ff85]" : metric.value > 50 ? "bg-[#ffb800]" : "bg-[#ff0040]"
                }`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
