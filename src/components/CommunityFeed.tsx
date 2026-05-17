"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
};

const ACTIVITY_ICONS: Record<string, string> = {
  MATCH_WON: "⚔️",
  MATCH_LOST: "⚔️",
  MATCH_DRAW: "🤝",
  TOURNAMENT: "🏆",
  TOURNAMENT_JOINED: "🎯",
  TOURNAMENT_WON: "👑",
  LEAGUE_JOINED: "📋",
  CLUB_JOINED: "🤝",
  NEW_SIGNING: "✍️",
  ACHIEVEMENT_UNLOCKED: "⭐",
  RANK_CHANGED: "📈",
};

function ActivityIcon({ type }: { type: string }) {
  return (
    <span className="shrink-0 text-sm" role="img" aria-label={type}>
      {ACTIVITY_ICONS[type] || "•"}
    </span>
  );
}

export function CommunityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/community/activity")
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {});
  }, []);

  const displayed = useMemo(() => activities.slice(0, 12), [activities]);

  if (displayed.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 300px at 30% 50%, rgba(52,211,153,0.04), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-6">
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"
                animate={{ scale: [1, 1.6, 1], opacity: [0.75, 0, 0.75] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald" />
            </span>
            <span className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald">Community Activity</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="frosted-card p-5 sm:p-6 rounded-[24px] max-w-2xl overflow-hidden"
        >
          <div className="divide-y divide-border-faint">
            {displayed.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="flex items-center gap-3 py-2.5 group"
              >
                <span className="h-8 w-8 rounded-[10px] bg-accent/8 flex items-center justify-center shrink-0 text-xs font-bold text-accent overflow-hidden">
                  {a.avatarUrl ? (
                    <img src={a.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ActivityIcon type={a.type} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-ink-soft truncate">
                    {a.username}
                  </span>
                  <span className="text-xs text-muted-soft ml-1.5 truncate">{a.message}</span>
                </div>
                <span className="text-[9px] text-muted-faint shrink-0 font-mono">
                  {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
