"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/rankings", label: "Rankings", icon: RankIcon },
  { href: "/tournaments", label: "Cups", icon: TrophyIcon },
  { href: "/clubs", label: "Clubs", icon: ShieldIcon },
  { href: "/profile", label: "Me", icon: UserIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto max-w-2xl grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className="relative flex flex-col items-center justify-center gap-1 py-2.5 px-1 text-[10px] font-medium uppercase tracking-wider"
              >
                <span
                  className={
                    "h-5 w-5 grid place-items-center transition-colors " +
                    (active ? "text-accent" : "text-muted")
                  }
                >
                  <Icon />
                </span>
                <span
                  className={
                    "transition-colors " +
                    (active ? "text-accent" : "text-muted")
                  }
                >
                  {label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 bg-accent"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function RankIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-8" />
      <path d="M22 20H2" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M17 5h3v3a3 3 0 0 1-3 3" />
      <path d="M7 5H4v3a3 3 0 0 0 3 3" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 3l8 3v6c0 4.5-3.5 8.5-8 9-4.5-.5-8-4.5-8-9V6l8-3z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </svg>
  );
}
