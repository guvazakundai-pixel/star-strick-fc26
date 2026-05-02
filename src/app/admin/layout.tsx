"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

const NAV_ITEMS = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "applications", label: "Applications", href: "/admin/applications" },
  { id: "reports", label: "Reports", href: "/admin/reports" },
  { id: "audit-logs", label: "Audit Logs", href: "/admin/audit-logs" },
  { id: "users", label: "Users", href: "/admin/users" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const router = useRouter()
  const [activeNav, setActiveNav] = useState("overview")

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    const path = window.location.pathname
    const item = NAV_ITEMS.find((n) => n.href === path)
    if (item) setActiveNav(item.id)
  }, [])

  if (user?.role !== "ADMIN") {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Access denied.</p></div>
  }

  return (
    <div className="broadcast-theme min-h-screen bc-noise flex">
      <aside className="w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-[#ff0040]/10 flex items-center justify-center text-sm font-bold text-[#ff0040]">
              ADMIN
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold truncate">Admin Panel</p>
              <p className="text-xs text-white/40">System Governance</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition ${
                activeNav === item.id
                  ? "bg-[#ff0040]/10 text-[#ff0040]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <NavIcon name={item.id} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-[#1a1a1a]">
          <Link href="/" className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Public Site
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function NavIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    overview: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    applications: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    reports: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    "audit-logs": <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  }
  return icons[name] || null
}
