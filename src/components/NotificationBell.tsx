"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { motion, AnimatePresence } from "framer-motion"

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?unread=true")
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount ?? 0)
        }
      } catch {}
    }

    fetchNotifications()

    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleClick = async () => {
    if (!isOpen) {
      setIsOpen(true)
      if (notifications.length === 0 && user) {
        setLoading(true)
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
    } else {
      setIsOpen(false)
    }
  }

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  if (!user) return null

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={handleClick}
        className="relative h-9 w-9 flex items-center justify-center rounded-sm hover:bg-white/5 transition text-white/70 hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-[10px] font-bold text-white rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 w-80 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-[#00ff85] hover:underline">Mark all read</button>
              )}
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-white/30 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-white/30 text-sm">No notifications</div>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n.id}
                    href={n.type === "POST_LIKE" || n.type === "POST_COMMENT" ? "/manager/posts" : "/dashboard"}
                    className={`block p-3 border-b border-[#1a1a1a] hover:bg-white/5 transition ${!n.isRead ? "bg-white/5" : ""}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <p className="text-sm text-white font-medium">{n.title}</p>
                    <p className="text-xs text-white/50 mt-1">{n.message}</p>
                    <p className="text-[10px] text-white/30 mt-2">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                ))
              )}
            </div>
            
            <div className="p-2 text-center">
              <Link href="/notifications" className="text-xs text-white/40 hover:text-white transition" onClick={() => setIsOpen(false)}>
                View all notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
