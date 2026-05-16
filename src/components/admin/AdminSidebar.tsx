"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/disputes", label: "Disputes" },
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
    <aside className="md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-60 shrink-0 border-r border-border-faint bg-bg-elevated/40 backdrop-blur-xl">
      <div className="p-4 border-b border-border-faint">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
          Admin Panel
        </p>
        <p className="bc-headline text-lg text-ink">{role}</p>
      </div>
      <div className="p-3 border-b border-border-faint grid grid-cols-3 gap-1 text-center">
        <div>
          <p className="bc-headline text-lg text-ink">{stats.users}</p>
          <p className="font-mono text-[9px] text-muted-soft uppercase">Users</p>
        </div>
        <div>
          <p className="bc-headline text-lg text-ink">{stats.clubs}</p>
          <p className="font-mono text-[9px] text-muted-soft uppercase">Clubs</p>
        </div>
        <div>
          <p className="bc-headline text-lg text-ink">{stats.matches}</p>
          <p className="font-mono text-[9px] text-muted-soft uppercase">Matches</p>
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
                "rounded-[12px] px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 text-center md:text-left whitespace-nowrap " +
                (active
                  ? "bg-accent/8 text-accent border border-accent/20"
                  : "text-muted-soft hover:text-ink hover:bg-bg-highlight/50 border border-transparent")
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