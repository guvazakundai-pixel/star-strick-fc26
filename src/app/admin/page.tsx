"use client"

import { useEffect, useState } from "react"
import { AdminCompetitionManager } from "@/components/AdminCompetitionManager"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClubs: 0,
    totalMatches: 0,
    pendingReports: 0,
  })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview" | "manage">("overview")

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
    return <div className="min-h-[50vh] flex items-center justify-center"><p className="text-muted-soft">Loading dashboard...</p></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
        <p className="text-muted-soft mt-1">System overview and governance controls</p>
      </div>

      <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint">
        <button
          onClick={() => setTab("overview")}
          className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
            tab === "overview" ? "bg-accent/15 text-accent shadow-sm" : "text-muted-soft hover:text-ink"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab("manage")}
          className={`flex-1 py-2.5 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all ${
            tab === "manage" ? "bg-accent/15 text-accent shadow-sm" : "text-muted-soft hover:text-ink"
          }`}
        >
          Manage Competitions
        </button>
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Users" value={String(stats.totalUsers)} tone="accent" />
            <StatCard label="Total Clubs" value={String(stats.totalClubs)} tone="gold" />
            <StatCard label="Open Reports" value={String(stats.pendingReports)} tone="danger" />
            <StatCard label="Total Matches" value={String(stats.totalMatches)} tone="accent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="frosted-card p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <QuickAction href="/admin/users" label="Manage Users" desc="View and manage all users" />
                <QuickAction href="/admin/points" label="Award Points" desc="Manually award or deduct points" />
                <QuickAction href="/admin/members" label="Club Members" desc="Approve, reject, promote members" />
                <QuickAction href="/admin/rankings" label="Club Rankings" desc="Reorder internal club rankings" />
                <QuickAction href="/admin/disputes" label="Disputes" desc="Resolve match disputes" />
                <QuickAction href="/admin/media" label="Media" desc="Manage uploads and gallery" />
                <QuickAction href="/admin/settings" label="Settings" desc="System configuration" />
              </div>
            </div>

            <div className="frosted-card p-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-soft mb-3">System Status</h3>
              <div className="space-y-3">
                <HealthMetric label="Users" value={stats.totalUsers} max={1000} />
                <HealthMetric label="Clubs" value={stats.totalClubs} max={100} />
                <HealthMetric label="Matches" value={stats.totalMatches} max={500} />
                <HealthMetric label="Pending Reports" value={stats.pendingReports} max={50} />
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "manage" && (
        <div className="frosted-card p-5 rounded-[24px]">
          <AdminCompetitionManager />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const colors: Record<string, string> = {
    accent: "text-accent",
    gold: "text-gold",
    danger: "text-negative",
  }
  return (
    <div className="frosted-card-sm p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">{label}</p>
      <p className={`text-2xl font-black mt-1 ${colors[tone ?? ""] || "text-ink"}`}>{value}</p>
    </div>
  )
}

function QuickAction({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-[14px] border border-border-faint bg-bg-highlight/50 px-4 py-3 hover:border-accent/18 transition-all duration-200 group"
    >
      <div>
        <span className="text-ink font-bold text-sm group-hover:text-accent transition-colors duration-200">{label}</span>
        <p className="text-xs text-muted-soft">{desc}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-muted-faint group-hover:text-accent transition-colors duration-200">
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
        <span className="text-muted">{label}</span>
        <span className="text-muted-faint">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-highlight overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${pct > 80 ? "bg-accent" : pct > 50 ? "bg-gold" : "bg-negative/80"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
