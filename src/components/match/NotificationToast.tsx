"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useNotifications } from "@/lib/use-notifications";

export function NotificationToast() {
  const { notifications, unreadCount, connected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((p) => !p), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative h-9 w-9 rounded-[10px] grid place-items-center bg-bg-elevated/60 border border-border-faint hover:bg-bg-highlight hover:border-border-strong transition-all duration-200"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-soft">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-accent text-bg text-[7px] font-black flex items-center justify-center px-1 leading-none shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="absolute top-full right-0 mt-2 z-50 w-80 rounded-[20px] border border-border-faint bg-bg-elevated/95 backdrop-blur-2xl shadow-2xl overflow-hidden"
              style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border-faint">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black tracking-[0.2em] uppercase text-muted-soft">Notifications</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-accent" : "bg-muted-faint"}`} />
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[9px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <span className="text-2xl block mb-2 opacity-40">🔔</span>
                    <p className="text-[11px] text-muted-soft">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-border-faint last:border-0 transition-colors duration-150 ${!n.isRead ? "bg-accent/3" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-ink leading-tight">{n.title}</p>
                          <p className="text-[10px] text-muted-soft mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                        {!n.isRead && (
                          <button
                            onClick={() => markRead(n.id)}
                            className="shrink-0 mt-0.5 h-5 w-5 rounded-full grid place-items-center text-muted-faint hover:text-ink transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono text-muted-faint">
                          {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {n.link && (
                          <Link href={n.link} onClick={close} className="text-[8px] font-bold uppercase tracking-wider text-accent hover:text-accent/80 transition-colors">
                            View
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 5 && (
                <Link
                  href="/notifications"
                  onClick={close}
                  className="block text-center py-3 text-[9px] font-bold uppercase tracking-wider text-muted-soft hover:text-accent border-t border-border-faint transition-colors"
                >
                  View all {notifications.length} notifications
                </Link>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
