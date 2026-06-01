"use client";

import Link from "next/link";
import { useUser, useAuthModal } from "@/lib/auth-context";
import { useAuthStore } from "@/store/auth-store";
import { useThemeStore } from "@/lib/theme-store";
import { NotificationBell } from "@/components/match/NotificationBell";

export function TopBar() {
  const { isAuthenticated, loading, user } = useUser();
  const { openAuth } = useAuthModal();
  const logout = useAuthStore((s) => s.logout);

  const isAdmin = user && (user.role === "MANAGER" || user.role === "ADMIN");

  if (loading) {
    return (
      <header
        className="sticky top-0 z-40 border-b border-b-white/[0.03]"
        style={{
          background: "radial-gradient(800px 60px at 50% 0%, rgba(0,255,133,0.03) 0%, transparent 60%), rgba(10,10,12,0.82)",
          backdropFilter: "blur(28px) saturate(1.6)",
          WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-13 flex items-center justify-between gap-4 w-full min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="ZIM FCPRO"
              className="h-8 w-8 rounded-[10px] object-cover group-hover:shadow-[0_0_20px_rgba(0,255,133,0.15)] transition-all duration-300"
              style={{ border: "1px solid rgba(0,255,133,0.20)" }}
            />
            <div className="leading-tight">
              <p className="cinematic-heading tracking-wider text-ink text-sm sm:text-base">ZIM FCPRO</p>
              <p className="font-mono text-[9px] text-muted-faint tracking-wider">FC26 · ZW</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-7 w-20 rounded-[10px] bg-white/5 animate-pulse" />
            <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-muted-soft">
              S1 · <span className="text-accent bc-live-dot">●</span> <span className="text-shimmer">Live</span>
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-40 border-b border-[var(--border-faint)]"
      style={{
        background: "radial-gradient(800px 60px at 50% 0%, var(--accent-soft) 0%, transparent 60%), var(--surface-ultra)",
        backdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
        WebkitBackdropFilter: "blur(var(--glass-blur)) saturate(1.6)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-13 flex items-center justify-between gap-4 w-full min-w-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="ZIM FCPRO"
            className="h-8 w-8 rounded-[10px] object-cover group-hover:shadow-[0_0_20px_rgba(0,255,133,0.15)] transition-all duration-300"
            style={{ border: "1px solid rgba(0,255,133,0.20)" }}
          />
          <div className="leading-tight">
            <p className="cinematic-heading tracking-wider text-ink text-sm sm:text-base">ZIM FCPRO</p>
            <p className="font-mono text-[9px] text-muted-faint tracking-wider">FC26 · ZW</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => useThemeStore.getState().toggle()}
            className="inline-flex items-center justify-center h-8 w-8 rounded-[10px] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all duration-200 text-sm"
            style={{ background: "var(--accent-soft)" }}
            aria-label="Toggle theme"
          >
            <span className="dark:hidden">🌙</span>
            <span className="light:hidden">☀️</span>
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex rounded-[10px] border border-accent/18 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-accent hover:bg-accent/8 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(0,255,133,0.06)] transition-all duration-300"
              style={{ background: "rgba(0,255,133,0.05)" }}
            >
              Control Panel
            </Link>
          )}
          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300 relative"
              >
                <NotificationBell />
              </Link>
              <Link
                href="/messages"
                className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-3.5 w-3.5 mr-1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Messages
              </Link>
              <Link
                href="/dashboard"
                className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft hover:bg-bg-highlight hover:text-ink hover:border-border-strong transition-all duration-300"
              >
                Dashboard
              </Link>
              <button
                onClick={logout}
                className="hidden sm:inline-flex rounded-[10px] border border-negative/30 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-negative/70 hover:bg-negative/10 hover:text-negative transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/rankings"
                className="hidden sm:inline-flex rounded-[10px] text-[9px] font-bold uppercase tracking-[0.2em] text-muted-soft hover:text-ink transition-all duration-300"
              >
                Rankings
              </Link>
              <Link
                href="/tournaments"
                className="hidden sm:inline-flex rounded-[10px] text-[9px] font-bold uppercase tracking-[0.2em] text-muted-soft hover:text-ink transition-all duration-300"
              >
                Tournaments
              </Link>
              <button
                onClick={() => openAuth("signin")}
                className="hidden sm:inline-flex rounded-[10px] border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-soft hover:bg-bg-highlight hover:text-ink transition-all duration-200"
              >
                Sign in
              </button>
            </>
          )}
          <span className="hidden md:inline-flex items-center gap-2 font-mono text-[10px] text-muted-soft">
            S1 · <span className="text-accent bc-live-dot">●</span> <span className="text-shimmer">Live</span>
          </span>
        </div>
      </div>
    </header>
  );
}
