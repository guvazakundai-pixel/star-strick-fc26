"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

export default function PlayMatchButton() {
  const { user } = useAuth()
  const router = useRouter()
  const [show, setShow] = useState(false)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    if (!user) return
    fetch("/api/match-requests?type=received")
      .then((r) => r.json())
      .then((data) => {
        const pending = (data.requests ?? []).filter((r: Record<string, unknown>) => r.status === "PENDING").length
        setPendingRequests(pending)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 200)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!user) return null

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-40"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
    >
      <button
        onClick={() => router.push("/matches/find")}
        className="relative h-14 w-14 rounded-full bg-[#00ff85] flex items-center justify-center shadow-lg shadow-[#00ff85]/20 hover:bg-white transition group"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-6 h-6 text-[#050505] group-hover:scale-110 transition">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12l3 3 5-5" />
        </svg>
        {pendingRequests > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#ffb800] text-[#050505] text-[10px] font-black flex items-center justify-center">
            {pendingRequests}
          </span>
        )}
      </button>
    </motion.div>
  )
}
