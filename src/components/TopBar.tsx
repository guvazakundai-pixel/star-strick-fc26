"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

export function TopBar() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="inline-grid place-items-center h-8 w-8 rounded bg-ink text-surface font-display text-lg leading-none">
            S
          </span>
          <div className="leading-tight">
            <p className="font-display tracking-wider text-ink text-base sm:text-lg">
              STAR STRICK
            </p>
            <p className="font-mono text-[10px] text-muted -mt-0.5">
              FC26 · Zimbabwe
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center gap-2 font-mono text-[11px] text-muted">
            Season 1 · Week 12
          </span>
          {user ? (
            <Link
              href="/dashboard"
              className="h-8 px-3 rounded-sm bg-[#00ff85]/10 text-[#00ff85] text-xs font-bold hover:bg-[#00ff85]/20 transition"
            >
              {user.username}
            </Link>
          ) : (
            <Link
              href="/login"
              className="h-8 px-3 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] text-white/60 text-xs font-bold hover:border-[#00ff85] hover:text-[#00ff85] transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
