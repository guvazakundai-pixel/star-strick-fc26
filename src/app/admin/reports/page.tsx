"use client"

import { useEffect, useState } from "react"

interface Report {
  id: string
  reporterId: string
  targetId: string
  targetType: string
  reason: string
  status: string
  reviewedById: string | null
  action: string | null
  createdAt: string
  reporter?: { username: string }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionAction, setResolutionAction] = useState("")

  useEffect(() => {
    const url = statusFilter === "ALL" ? "/api/reports" : `/api/reports?status=${statusFilter}`
    fetch(url)
      .then((r) => r.json())
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  async function resolveReport(reportId: string, action: string) {
    const res = await fetch(`/api/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setResolvingId(null)
      setResolutionAction("")
      const url = statusFilter === "ALL" ? "/api/reports" : `/api/reports?status=${statusFilter}`
      const data = await fetch(url).then((r) => r.json())
      setReports(data.reports ?? [])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-white/50 mt-1">Review and resolve user reports</p>
        </div>
        <div className="flex gap-2">
          {["ALL", "PENDING", "RESOLVED", "DISMISSED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-8 px-3 rounded-sm text-xs font-bold transition ${
                statusFilter === s
                  ? "bg-[#ff0040] text-white"
                  : "bg-[#111] text-white/50 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
          <p className="text-white/40">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <TypeBadge type={report.targetType} />
                    <StatusBadge status={report.status} />
                    <span className="text-xs text-white/30 ml-auto">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white font-bold">Target: {report.targetId}</p>
                  <p className="text-sm text-white/60 mt-1">{report.reason}</p>
                  <p className="text-xs text-white/30 mt-1">
                    Reported by: {report.reporter?.username ?? report.reporterId}
                  </p>
                </div>

                {report.status === "PENDING" && resolvingId !== report.id && (
                  <button
                    onClick={() => setResolvingId(report.id)}
                    className="h-8 px-3 rounded-sm bg-[#ff0040]/10 text-[#ff0040] text-xs font-bold hover:bg-[#ff0040]/20 transition whitespace-nowrap"
                  >
                    Resolve
                  </button>
                )}

                {resolvingId === report.id && (
                  <div className="flex flex-col gap-2">
                    <select
                      value={resolutionAction}
                      onChange={(e) => setResolutionAction(e.target.value)}
                      className="h-8 px-3 rounded-sm border border-[#1a1a1a] bg-[#111] text-sm text-white"
                    >
                      <option value="">Select action...</option>
                      <option value="BAN_USER">Ban User</option>
                      <option value="SHADOW_BAN">Shadow Ban</option>
                      <option value="DELETE_CONTENT">Delete Content</option>
                      <option value="WARN">Issue Warning</option>
                      <option value="DISMISS">Dismiss Report</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => resolveReport(report.id, resolutionAction)}
                        disabled={!resolutionAction}
                        className="h-7 px-3 rounded-sm bg-[#00ff85] text-[#050505] text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolutionAction("") }}
                        className="h-7 px-3 rounded-sm bg-[#111] text-white/60 text-xs font-bold hover:text-white transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {report.status !== "PENDING" && (
                  <div className="text-xs text-white/40 whitespace-nowrap">
                    Action: {report.action ?? "Dismissed"}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    USER: "bg-blue-500/10 text-blue-400",
    CLUB: "bg-purple-500/10 text-purple-400",
    POST: "bg-green-500/10 text-green-400",
    MATCH: "bg-orange-500/10 text-orange-400",
  }
  return <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${colors[type] ?? "bg-white/5 text-white/60"}`}>{type}</span>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    RESOLVED: "bg-green-500/10 text-green-400",
    DISMISSED: "bg-white/5 text-white/40",
  }
  return <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${colors[status] ?? "bg-white/5 text-white/60"}`}>{status}</span>
}
