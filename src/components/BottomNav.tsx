"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthModal } from "@/lib/auth-context";
import { useSession } from "@/lib/session-client";

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
      <div className="mx-auto max-w-lg px-3 pb-1.5 pt-0.5">
        <div
          className="flex items-center justify-around rounded-[22px] border border-b-0 px-1 py-1.5"
          style={{
            background: "rgba(14,14,16,0.72)",
            backdropFilter: "blur(28px) saturate(1.6)",
            WebkitBackdropFilter: "blur(28px) saturate(1.6)",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 0.5px rgba(255,255,255,0.03)",
          }}
        >
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[16px] transition-all duration-200"
                style={active ? { background: "rgba(0,255,133,0.06)" } : undefined}
              >
                <span
                  className={
                    "h-[18px] w-[18px] grid place-items-center transition-colors duration-200 " +
                    (active ? "text-accent" : "text-muted-soft group-hover:text-ink-soft")
                  }
                >
                  <Icon />
                </span>
                <span
                  className={
                    "text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 " +
                    (active ? "text-accent" : "text-muted-soft group-hover:text-ink-soft")
                  }
                >
                  {label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute -top-1 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-accent"
                    style={{ boxShadow: "0 0 10px rgba(0,255,133,0.50)" }}
                  />
                )}
              </Link>
            );
          })}
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[16px] transition-all duration-200"
              style={(pathname.startsWith("/dashboard") || pathname === "/profile") ? { background: "rgba(0,255,133,0.06)" } : undefined}
            >
              <span
                className={
                  "h-[18px] w-[18px] grid place-items-center transition-colors duration-200 " +
                  (pathname.startsWith("/dashboard") || pathname === "/profile"
                    ? "text-accent"
                    : "text-muted-soft group-hover:text-ink-soft")
                }
              >
                <UserIcon />
              </span>
              <span
                className={
                  "text-[9px] font-semibold uppercase tracking-wider transition-all duration-200 " +
                  (pathname.startsWith("/dashboard") || pathname === "/profile"
                    ? "text-accent"
                    : "text-muted-soft group-hover:text-ink-soft")
                }
              >
                Me
              </span>
              {(pathname.startsWith("/dashboard") || pathname === "/profile") && (
                <span
                  aria-hidden
                  className="absolute -top-1 left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full bg-accent"
                  style={{ boxShadow: "0 0 10px rgba(0,255,133,0.50)" }}
                />
              )}
            </Link>
          ) : (
            <button
              onClick={() => openAuth("signin")}
              className="group relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-[16px] transition-all duration-200"
            >
              <span className="h-[18px] w-[18px] grid place-items-center text-muted-soft group-hover:text-ink-soft transition-colors duration-200">
                <UserIcon />
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-soft group-hover:text-ink-soft transition-colors duration-200">Me</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function RankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}