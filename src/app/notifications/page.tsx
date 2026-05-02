"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link: string | null
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data.notifications ?? [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><p className="text-white/40">Loading...</p></div>

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="bc-headline text-3xl text-white">Notifications</h1>
          <button
            onClick={markAllRead}
            className="text-sm text-[#00ff85] hover:underline"
          >
            Mark all as read
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-white/40 text-center py-10">No notifications yet.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-sm border p-4 transition ${
                  n.isRead
                    ? "border-[#1a1a1a] bg-[#0a0a0a]"
                    : "border-[#00ff85]/30 bg-[#00ff85]/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-bold">{n.title}</h3>
                    <p className="text-sm text-white/60 mt-1">{n.message}</p>
                    <p className="text-xs text-white/30 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="text-xs text-[#00ff85] hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                {n.link && (
                  <a
                    href={n.link}
                    className="mt-3 inline-block text-xs text-white/40 hover:text-white transition"
                  >
                    View details →
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
