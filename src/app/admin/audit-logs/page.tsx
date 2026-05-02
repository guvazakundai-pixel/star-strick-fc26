"use client"

import { useEffect, useState } from "react"

interface AuditLog {
  id: string
  adminId: string
  action: string
  target: string
  details: Record<string, unknown> | null
  createdAt: string
  admin?: { username: string }
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("")

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((r) => r.json())
      .then((data) => setLogs(data.logs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(filter.toLowerCase()) ||
          l.target.toLowerCase().includes(filter.toLowerCase())
      )
    : logs

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-white/50 mt-1">Complete history of administrative actions</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 w-64 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff0040]/50"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading logs...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
          <p className="text-white/40">No audit logs found</p>
        </div>
      ) : (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Admin</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Action</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Target</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#ff0040] font-bold">{log.admin?.username ?? log.adminId}</span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-4 py-3 text-white/70 font-mono text-xs">{log.target}</td>
                  <td className="px-4 py-3">
                    {log.details ? (
                      <pre className="text-xs text-white/50 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </pre>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    RANKING_RECALCULATE: "bg-purple-500/10 text-purple-400",
    CLUB_APPROVE: "bg-[#00ff85]/10 text-[#00ff85]",
    CLUB_REJECT: "bg-red-500/10 text-red-400",
    CLUB_BAN: "bg-red-500/10 text-red-400",
    USER_BAN: "bg-red-500/10 text-red-400",
    USER_SHADOW_BAN: "bg-yellow-500/10 text-yellow-400",
    APPLICATION_REVIEW: "bg-blue-500/10 text-blue-400",
    REPORT_RESOLVE: "bg-orange-500/10 text-orange-400",
  }
  const colorClass = colors[action] ?? "bg-white/5 text-white/60"
  return <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${colorClass}`}>{action}</span>
}
