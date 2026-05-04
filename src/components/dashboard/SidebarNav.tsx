"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS: ReadonlyArray<{ href: string; label: string; exact?: boolean }> = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/rankings", label: "Rankings" },
  { href: "/dashboard/media", label: "Media" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function SidebarNav({ clubName }: { clubName: string }) {
  const pathname = usePathname();
  return (
    <aside className="md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-60 shrink-0 border-r border-[var(--bc-border)] bg-[var(--bc-surface)]/40">
      <div className="p-4 border-b border-[var(--bc-border)]">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Control Panel
        </p>
        <p className="bc-headline text-lg text-white truncate" title={clubName}>
          {clubName}
        </p>
      </div>
      <nav className="p-2 grid grid-cols-5 md:grid-cols-1 gap-1 overflow-x-auto">
        {ITEMS.map((it) => {
          const active = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "rounded px-3 py-2 text-sm uppercase tracking-wider font-bold transition-colors text-center md:text-left " +
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
