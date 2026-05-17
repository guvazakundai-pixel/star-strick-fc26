"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  username: string;
  createdAt: string;
};

export function CommunityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/activity?limit=20")
      .then((r) => r.json())
      .then((d) => setActivities(d.activities ?? []))
      .catch(() => {});
  }, []);

  if (activities.length === 0) return null;

  return (
    <section className="relative py-12 sm:py-16">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald" style={{ boxShadow: "0 0 8px rgba(52,211,153,0.60)" }} />
          <span className="text-[10px] font-black tracking-[0.28em] uppercase text-emerald">Community Activity</span>
        </div>
        <div className="glass-emerald p-5 rounded-[24px] max-w-2xl">
          <div className="space-y-2">
            {activities.slice(0, 8).map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 text-xs text-muted-soft py-1.5 border-b border-border-faint last:border-0"
              >
                <span className="h-1 w-1 rounded-full bg-accent/40 shrink-0" />
                <span className="font-bold text-ink-soft truncate">@{a.username}</span>
                <span className="truncate flex-1">{a.message}</span>
                <span className="text-[10px] text-muted-faint shrink-0 font-mono">
                  {new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
