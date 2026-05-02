"use client"

import { useEffect, useState } from "react"

interface User {
  id: string
  username: string
  email: string
  role: string
  isShadowBanned: boolean
  isVerified: boolean
  createdAt: string
  _count?: { memberships: number }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/admin?type=users")
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function updateRole(userId: string, role: string) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      )
    }
  }

  async function toggleShadowBan(userId: string, banned: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isShadowBanned: banned }),
    })
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isShadowBanned: banned } : u))
      )
    }
  }

  const filtered = search
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-white/50 mt-1">Manage all platform users</p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-64 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff0040]/50"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm">Loading users...</div>
      ) : (
        <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">User</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3">
                    <div>
                      <span className="text-white font-bold">{user.username}</span>
                      <p className="text-xs text-white/30">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-x-1">
                      {user.isVerified && <span className="px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-400 text-xs">Verified</span>}
                      {user.isShadowBanned && <span className="px-1.5 py-0.5 rounded-sm bg-yellow-500/10 text-yellow-400 text-xs">Shadow Banned</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="h-7 px-2 rounded-sm border border-[#1a1a1a] bg-[#111] text-xs text-white"
                      >
                        <option value="PLAYER">Player</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => toggleShadowBan(user.id, !user.isShadowBanned)}
                        className={`h-7 px-2 rounded-sm text-xs font-bold transition ${
                          user.isShadowBanned
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                        }`}
                      >
                        {user.isShadowBanned ? "Unban" : "Shadow Ban"}
                      </button>
                    </div>
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

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-[#ff0040]/10 text-[#ff0040]",
    MANAGER: "bg-purple-500/10 text-purple-400",
    PLAYER: "bg-white/5 text-white/60",
  }
  return (
    <span className={`px-2 py-0.5 rounded-sm text-xs font-bold ${colors[role] ?? "bg-white/5 text-white/60"}`}>
      {role}
    </span>
  )
}
