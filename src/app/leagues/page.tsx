"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type League = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  status: string;
  participantCount: number;
  maxPlayers: number;
  admin: { username: string; displayName: string | null };
};

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/leagues?limit=50")
      .then((r) => r.json())
      .then((d) => { setLeagues(d.data?.leagues || []); setLoading(false); })
      .catch(() => { setLeagues([]); setLoading(false); });
  }, []);

  const filtered = leagues.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Competition</p>
            <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink mt-1">Leagues</h1>
            <p className="text-muted-soft text-sm mt-1">Create or join a league. Compete for the title.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/leagues/create" className="btn-primary h-11 px-6 text-xs rounded-[16px]">Create League</Link>
            <Link href="/leagues/join" className="btn-ghost h-11 px-6 text-xs rounded-[16px]">Join</Link>
          </div>
        </motion.div>

        <div className="mb-6">
          <input
            className="input-premium w-full max-w-md"
            placeholder="Search leagues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card h-44 rounded-[24px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-soft text-lg">No leagues found</p>
            <Link href="/leagues/create" className="btn-primary inline-flex mt-4 h-11 px-6 text-xs rounded-[16px]">Create the first league</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((league, i) => (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/leagues/${league.id}`} className="block frosted-card p-5 rounded-[24px] hover:border-accent/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-wider" style={{
                      background: league.type === "PUBLIC" ? "rgba(0,255,133,0.08)" : "rgba(168,85,247,0.08)",
                      border: `1px solid ${league.type === "PUBLIC" ? "rgba(0,255,133,0.16)" : "rgba(168,85,247,0.16)"}`,
                      color: league.type === "PUBLIC" ? "#00ff85" : "#a855f7",
                    }}>
                      {league.type}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      league.status === "LIVE" ? "text-accent" : league.status === "COMPLETED" ? "text-muted-faint" : "text-cyan"
                    }`}>{league.status}</span>
                  </div>
                  <h3 className="cinematic-heading text-xl text-ink">{league.name}</h3>
                  {league.description && (
                    <p className="text-muted-soft text-xs mt-1 line-clamp-2">{league.description}</p>
                  )}
                  <div className="mt-4 flex items-center gap-3 text-[10px] text-muted-faint font-mono">
                    <span>{league.participantCount}/{league.maxPlayers} players</span>
                    <span>·</span>
                    <span>@{league.admin.username}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
