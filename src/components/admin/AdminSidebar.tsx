"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: Array<"ADMIN" | "MANAGER">;
};

const ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/admin/control-tower",
    label: "Control Tower",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    roles: ["ADMIN"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/admin/tournaments",
    label: "Tournaments",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 6 9Z" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 18 9Z" />
        <path d="M4 22h16" />
        <path d="M10 22V2h4v20" />
      </svg>
    ),
  },
  {
    href: "/admin/leagues",
    label: "Leagues",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M12 2L2 7l10 5 10-5-10-5Z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    href: "/admin/clubs",
    label: "Clubs",
    roles: ["ADMIN"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/admin/disputes",
    label: "Disputes",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    href: "/admin/points",
    label: "Points",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    href: "/admin/media",
    label: "Media",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    roles: ["ADMIN"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
      </svg>
    ),
  },
  {
    href: "/admin/rankings",
    label: "Rankings",
    roles: ["ADMIN", "MANAGER"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

export function AdminSidebar({
  currentPath,
  role,
  className = "",
}: {
  currentPath?: string;
  role: string;
  className?: string;
}) {
  const pathname = usePathname();
  const resolvedPath = currentPath ?? pathname;
  const [open, setOpen] = useState(false);
  const visible = ITEMS.filter((i) => i.roles.includes(role as "ADMIN" | "MANAGER"));

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full glass-v2-accent flex items-center justify-center shadow-xl"
        aria-label="Toggle sidebar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-accent">
          {open ? (
            <line x1="18" y1="6" x2="6" y2="18" />
          ) : (
            <line x1="3" y1="6" x2="21" y2="6" />
          )}
          {open ? null : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      <aside
        className={`
          fixed md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-56 shrink-0
          border-r border-border-faint bg-bg-elevated/40 backdrop-blur-xl z-40
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${className}
        `}
      >
        <div className="p-4 border-b border-border-faint">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
            Admin Panel
          </p>
          <p className="bc-headline text-lg text-ink capitalize">{role.toLowerCase()}</p>
        </div>

        <nav className="p-2 space-y-0.5 overflow-y-auto max-h-[calc(100vh-10rem)]">
          {visible.map((item) => {
            const active =
              item.href === "/admin"
                ? resolvedPath === "/admin"
                : resolvedPath.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold transition-all duration-200 ${
                  active
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-muted-soft hover:text-ink hover:bg-bg-highlight/50 border border-transparent"
                }`}
              >
                <span className={`shrink-0 ${active ? "text-accent" : "text-muted-faint"}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
