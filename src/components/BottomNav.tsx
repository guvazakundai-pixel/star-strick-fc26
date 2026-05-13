"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/lib/auth-context";
import { useSession } from "@/lib/session-client";
import { motion } from "framer-motion";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/rankings", label: "Rankings", icon: RankIcon },
  { href: "/matches", label: "Play", icon: PlayIcon },
  { href: "/clubs", label: "Clubs", icon: ShieldIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { openAuth } = useAuthModal();
  const session = useSession();
  const loggedIn = !!session;

  return (
    <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg px-3 pb-2 pt-1">
        <div
          className="flex items-center justify-around rounded-[22px] border border-white/[0.04] border-b-0 px-1 py-1.5 dock-glow"
          style={{
            background: "rgba(10,10,12,0.82)",
            backdropFilter: "blur(32px) saturate(1.8)",
            WebkitBackdropFilter: "blur(32px) saturate(1.8)",
          }}
        >
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="bc-nav-pill group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[14px] transition-all duration-300"
                data-active={active}
              >
                <span
                  className={
                    "h-[16px] w-[16px] grid place-items-center transition-all duration-300 " +
                    (active ? "text-accent" : "text-muted-soft group-hover:text-ink-soft")
                  }
                >
                  <Icon />
                </span>
                <span
                  className={
                    "text-[8px] font-bold uppercase tracking-[0.18em] transition-all duration-300 " +
                    (active ? "text-accent" : "text-muted-faint group-hover:text-muted-soft")
                  }
                >
                  {label}
                </span>
                {active && (
                  <motion.span
                    layoutId="nav-pill-indicator"
                    aria-hidden
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] min-w-[20px] rounded-full"
                    style={{
                      background: "var(--accent)",
                      boxShadow: "0 0 14px rgba(0,255,133,0.60), 0 0 4px rgba(0,255,133,0.30)",
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
              </Link>
            );
          })}
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="bc-nav-pill group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[14px] transition-all duration-300"
              data-active={pathname.startsWith("/dashboard") || pathname === "/profile"}
            >
              <span
                className={
                  "h-[16px] w-[16px] grid place-items-center transition-all duration-300 " +
                  (pathname.startsWith("/dashboard") || pathname === "/profile"
                    ? "text-accent"
                    : "text-muted-soft group-hover:text-ink-soft")
                }
              >
                <UserIcon />
              </span>
              <span
                className={
                  "text-[8px] font-bold uppercase tracking-[0.18em] transition-all duration-300 " +
                  (pathname.startsWith("/dashboard") || pathname === "/profile"
                    ? "text-accent"
                    : "text-muted-faint group-hover:text-muted-soft")
                }
              >
                Me
              </span>
              {(pathname.startsWith("/dashboard") || pathname === "/profile") && (
                <motion.span
                  layoutId="nav-pill-indicator"
                  aria-hidden
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-[3px] min-w-[20px] rounded-full"
                  style={{
                    background: "var(--accent)",
                    boxShadow: "0 0 14px rgba(0,255,133,0.60), 0 0 4px rgba(0,255,133,0.30)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
            </Link>
          ) : (
            <button
              onClick={() => openAuth("signin")}
              className="bc-nav-pill group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[14px] transition-all duration-300"
              data-active="false"
            >
              <span className="h-[16px] w-[16px] grid place-items-center text-muted-soft group-hover:text-ink-soft transition-all duration-300">
                <UserIcon />
              </span>
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-faint group-hover:text-muted-soft transition-all duration-300">
                Me
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function RankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
      <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[16px] w-[16px]">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}