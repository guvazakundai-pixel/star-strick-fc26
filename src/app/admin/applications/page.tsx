"use client"

import { useEffect, useState } from "react"

interface Application {
  id: string
  userId: string
  clubNameRequested: string
  description: string
  status: string
  createdAt: string
  user?: { username: string; email: string }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("PENDING")

  useEffect(() => {
    fetch("/api/admin?type=applications")
      .then((r) => r.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function reviewApplication(id: string, status: "APPROVED" | "REJECTED") {
    const res = await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      )
    }
  }

  const filtered =
    filter === "ALL" ? applications : applications.filter((a) => a.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manager Applications</h1>
          <p className="text-white/50 mt-1">Review and approve manager requests</p>
        </div>
        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REJECTED", "ALL"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`h-8 px-3 rounded-sm text-xs font-bold transition ${
                filter === s
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
        <div className="text-white/40 text-sm">Loading applications...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-8 text-center">
          <p className="text-white/40">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-bold text-lg">
                      {app.clubNameRequested}
                    </span>
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-white/30 ml-auto">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">
                    Applicant:{" "}
                    <span className="text-[#00ff85]">
                      {app.user?.username ?? app.userId}
                    </span>
                  </p>
                  {app.user?.email && (
                    <p className="text-xs text-white/30">{app.user.email}</p>
                  )}
                  <p className="text-sm text-white/50 mt-2">{app.description}</p>
                </div>

                {app.status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewApplication(app.id, "APPROVED")}
                      className="h-8 px-4 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-xs font-bold hover:bg-[#00ff85]/20 transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reviewApplication(app.id, "REJECTED")}
                      className="h-8 px-4 rounded-sm bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition"
                    >
                      Reject
                    </button>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-400",
    APPROVED: "bg-green-500/10 text-green-400",
    REJECTED: "bg-red-500/10 text-red-400",
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-sm text-xs font-bold ${
        colors[status] ?? "bg-white/5 text-white/60"
      }`}
    >
      {status}
    </span>
  )
}
