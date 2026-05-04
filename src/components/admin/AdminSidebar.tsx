"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/points", label: "Points" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/rankings", label: "Rankings" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({
  role,
  stats,
}: {
  role: string;
  stats: { users: number; clubs: number; matches: number };
}) {
  const pathname = usePathname();

  return (
    <aside className="md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-60 shrink-0 border-r border-[var(--bc-border)] bg-[var(--bc-surface)]/40">
      <div className="p-4 border-b border-[var(--bc-border)]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Admin Panel
        </p>
        <p className="bc-headline text-lg text-white">{role}</p>
      </div>
      <div className="p-3 border-b border-[var(--bc-border)] grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="bc-headline text-lg text-white">{stats.users}</p>
          <p className="font-mono text-[9px] text-[var(--bc-text-soft)] uppercase">Users</p>
        </div>
        <div>
          <p className="bc-headline text-lg text-white">{stats.clubs}</p>
          <p className="font-mono text-[9px] text-[var(--bc-text-soft)] uppercase">Clubs</p>
        </div>
        <div>
          <p className="bc-headline text-lg text-white">{stats.matches}</p>
          <p className="font-mono text-[9px] text-[var(--bc-text-soft)] uppercase">Matches</p>
        </div>
      </div>
      <nav className="p-2 grid grid-cols-4 md:grid-cols-1 gap-1 overflow-x-auto">
        {ITEMS.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "rounded px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors text-center md:text-left whitespace-nowrap " +
                (active
                  ? "bg-[var(--bc-accent)]/15 text-[var(--bc-accent)] border border-[var(--bc-accent)]/40"
                  : "text-white/80 hover:text-white hover:bg-white/5 border border-transparent")
              }
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}