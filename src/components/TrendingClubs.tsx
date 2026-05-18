"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Carousel } from "@/components/ui/Carousel";

type ClubCard = {
  id: string;
  name: string;
  slug: string;
  tag: string;
  city: string;
  clubXp: number;
  winRate: number;
  memberCount: number;
  globalRank: { rankPosition: number } | null;
  streak?: number;
};

function ClubAvatar({ name, tag }: { name: string; tag: string }) {
  const initials = tag.slice(0, 2).toUpperCase();
  return (
    <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-purple/20 border border-accent/15 text-accent text-sm font-black tracking-tight">
      {initials}
    </span>
  );
}

function HotStreakIndicator({ streak }: { streak?: number }) {
  if (!streak || streak < 3) return null;
  const flames = streak >= 5 ? 3 : streak >= 4 ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-0.5 text-gold text-[10px]" title={`${streak} win streak`}>
      {"🔥".repeat(flames)}
    </span>
  );
}

function XpProgressBar({ xp, maxXp = 5000 }: { xp: number; maxXp?: number }) {
  const progress = Math.min((xp % maxXp) / maxXp, 1);
  const level = Math.floor(xp / maxXp) + 1;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] text-muted-faint">
        <span>Lv.{level}</span>
        <span>{xp % maxXp}/{maxXp} XP</span>
      </div>
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-gold"
          initial={{ width: 0 }}
          whileInView={{ width: `${progress * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

export function TrendingClubs({
  clubs: externalClubs,
  className = "",
}: {
  clubs?: ClubCard[];
  className?: string;
}) {
  const [internalClubs, setInternalClubs] = useState<ClubCard[]>([]);

  useEffect(() => {
    if (externalClubs) return;
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((d) => setInternalClubs(d.clubs ?? []))
      .catch(() => {});
  }, [externalClubs]);

  const clubs = externalClubs ?? internalClubs;

  const trending = useMemo(() => [...clubs].sort((a, b) => b.clubXp - a.clubXp).slice(0, 12), [clubs]);

  if (trending.length === 0) return null;

  return (
    <section className={`relative py-16 sm:py-20 ${className}`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(800px 300px at 50% 100%, rgba(168,85,247,0.04), transparent 60%)" }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-[0.28em] uppercase text-gold">Trending</span>
            </div>
            <h2 className="cinematic-heading text-2xl sm:text-3xl text-ink">
              Top <span className="text-gradient-gold">Clubs</span>
            </h2>
          </div>
          <Link
            href="/clubs"
            className="text-[10px] font-bold uppercase tracking-wider text-gold hover:text-gold/80 transition-colors shrink-0"
          >
            View All &rarr;
          </Link>
        </motion.div>

        <Carousel
          items={trending}
          renderItem={(c: ClubCard, i: number) => (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              className="w-[280px] sm:w-[300px]"
            >
              <Link
                href={`/club/${c.slug}`}
                className="group block frosted-card rounded-[20px] card-interactive h-full relative overflow-hidden"
              >
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(400px 200px at 50% 100%, rgba(255,184,0,0.05), transparent 60%)",
                  }}
                />
                <div className="relative z-10 p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <ClubAvatar name={c.name} tag={c.tag} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="cinematic-heading text-base sm:text-lg text-ink truncate group-hover:text-gold transition-colors duration-200">
                            {c.name}
                          </h3>
                          <HotStreakIndicator streak={c.streak} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-bold text-muted-faint uppercase tracking-wider">[{c.tag}]</span>
                          <span className="text-[9px] text-muted-soft">{c.city}</span>
                        </div>
                      </div>
                    </div>
                    {c.globalRank && (
                      <span className="cinematic-heading text-lg text-gold tabular-nums shrink-0">
                        #{c.globalRank.rankPosition}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-px bg-border-faint rounded-[10px] overflow-hidden border border-border-faint mb-3 mt-auto">
                    <ClubStat label="Members" value={c.memberCount} />
                    <ClubStat label="Win Rate" value={`${Math.round(c.winRate)}%`} accent={c.winRate >= 50} />
                    <ClubStat label="XP" value={c.clubXp.toLocaleString()} />
                  </div>

                  <XpProgressBar xp={c.clubXp} />
                </div>
              </Link>
            </motion.div>
          )}
          gap={16}
        />
      </div>
    </section>
  );
}

function ClubStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-bg/50 px-2 py-2 min-w-0">
      <p className="text-[6px] font-black tracking-[0.2em] uppercase text-muted-faint truncate">{label}</p>
      <p className={`text-sm tabular-nums leading-none mt-0.5 truncate ${accent ? "text-accent" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
