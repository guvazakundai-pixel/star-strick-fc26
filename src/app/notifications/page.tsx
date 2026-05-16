"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useNotifications } from "@/lib/use-notifications";

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, connected } = useNotifications();

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">Inbox</p>
            <h1 className="bc-headline mt-1 text-3xl sm:text-4xl text-ink">Notifications</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-accent" : "bg-muted-faint"}`} />
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors">
                Mark all read
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="frosted-card p-12 text-center">
            <span className="text-5xl block mb-4 opacity-40">🔔</span>
            <p className="text-muted-soft text-sm">No notifications yet</p>
            <p className="text-muted-faint text-xs mt-1">Challenge someone to get started!</p>
            <Link href="/matches/find" className="inline-flex mt-5 h-11 rounded-[14px] cta-primary px-6 text-sm font-bold tracking-wider items-center justify-center">
              Find a Match
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-1">
              {notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-[16px] p-4 border transition-all duration-200 ${
                    !n.isRead
                      ? "bg-accent/5 border-accent/15"
                      : "bg-bg-elevated/40 border-border-faint"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">{n.title}</p>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                      </div>
                      <p className="text-[12px] text-muted-soft mt-0.5 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-mono text-muted-faint">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => markRead(n.id)}
                            className="text-[9px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors"
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="shrink-0 h-8 w-8 rounded-full grid place-items-center text-muted-faint hover:text-ink hover:bg-bg-highlight transition-all duration-200"
                        aria-label="Mark read"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
