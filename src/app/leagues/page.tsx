"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/session-client";

type League = {
  id: string; name: string; slug: string; description: string | null;
  type: string; status: string; participantCount: number; maxPlayers: number;
  admin: { username: string; displayName: string | null };
};

type MyLeague = {
  id: string; name: string; slug: string; type: string; status: string;
  description: string | null; maxPlayers: number; participantCount: number;
  myStats: { points: number; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDiff: number; form: string };
  nextMatchday: number | null; totalFixtures: number; completedFixtures: number; adminName: string;
};

type Tab = "browse" | "current";

export default function LeaguesPage() {
  const session = useSession();
  const [tab, setTab] = useState<Tab>("browse");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [myLeagues, setMyLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [browseRes, myRes] = await Promise.all([
        fetch("/api/leagues?limit=50"),
        session ? fetch("/api/leagues/my") : Promise.resolve(null),
      ]);
      const browseData = await browseRes.json();
      setLeagues(browseData.data?.leagues || []);
      if (myRes) {
        const myData = await myRes.json();
        setMyLeagues(myData.data || []);
      }
    } catch {} finally { setLoading(false); }
  }, [session]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = tab === "browse"
    ? leagues.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">Competition</p>
            <h1 className="cinematic-heading text-4xl sm:text-5xl text-ink mt-1">Leagues</h1>
            <p className="text-muted-soft text-sm mt-1">Create, join, and compete in leagues. Track your season live.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/leagues/create" className="btn-primary h-11 px-6 text-xs rounded-[16px]">Create League</Link>
            <Link href="/leagues/join" className="btn-ghost h-11 px-6 text-xs rounded-[16px]">Join</Link>
          </div>
        </motion.div>

        <div className="flex gap-4 mb-6 border-b border-border-faint">
          <button onClick={() => setTab("browse")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              tab === "browse" ? "text-accent border-accent" : "text-muted-soft border-transparent hover:text-ink"
            }`}>Browse Leagues</button>
          <button onClick={() => setTab("current")}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative ${
              tab === "current" ? "text-accent border-accent" : "text-muted-soft border-transparent hover:text-ink"
            }`}>
            My Leagues
            {myLeagues.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[8px] rounded-full bg-accent text-black font-bold">{myLeagues.length}</span>
            )}
          </button>
        </div>

        {tab === "browse" && (
          <div className="mb-6">
            <input className="input-premium w-full max-w-md" placeholder="Search leagues..." value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-card h-44 rounded-[24px]" />)}
          </div>
        ) : tab === "current" && !session ? (
          <div className="text-center py-20">
            <p className="text-muted-soft text-lg">Sign in to see your leagues</p>
            <Link href="/login?next=/leagues" className="btn-primary inline-flex mt-4 h-11 px-6 text-xs rounded-[16px]">Sign In</Link>
          </div>
        ) : tab === "current" && myLeagues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-soft text-lg">You're not in any leagues yet</p>
            <Link href="/leagues/join" className="btn-primary inline-flex mt-4 h-11 px-6 text-xs rounded-[16px]">Join a League</Link>
          </div>
        ) : tab === "current" ? (
          <div className="space-y-4">
            {myLeagues.map((l, i) => {
              const progress = l.totalFixtures > 0 ? Math.round((l.completedFixtures / l.totalFixtures) * 100) : 0;
              return (
                <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/leagues/${l.id}`} className="block frosted-card p-5 rounded-[24px] hover:border-accent/20 transition-all duration-300">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="cinematic-heading text-xl text-ink truncate">{l.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            l.status === "LIVE" ? "text-accent bg-accent/10" : l.status === "COMPLETED" ? "text-muted-faint bg-white/5" : "text-cyan bg-cyan/10"
                          }`}>{l.status}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-soft">
                          <span className="flex items-center gap-1">Position: <strong className="text-ink">#{l.myStats.played > 0 ? "?" : "N/A"}</strong></span>
                          <span className="flex items-center gap-1">Pts: <strong className="text-ink">{l.myStats.points}</strong></span>
                          <span className="flex items-center gap-1">Pld: <strong className="text-ink">{l.myStats.played}</strong></span>
                          <span className="flex items-center gap-1">W: <strong className="text-accent">{l.myStats.wins}</strong></span>
                          <span className="flex items-center gap-1">D: <strong className="text-gold">{l.myStats.draws}</strong></span>
                          <span className="flex items-center gap-1">L: <strong className="text-negative">{l.myStats.losses}</strong></span>
                          <span className="flex items-center gap-1">GD: <strong className={l.myStats.goalDiff >= 0 ? "text-accent" : "text-negative"}>{l.myStats.goalDiff > 0 ? "+" : ""}{l.myStats.goalDiff}</strong></span>
                          {l.myStats.form && (
                            <span className="flex items-center gap-1">Form: <FormIndicator form={l.myStats.form} /></span>
                          )}
                        </div>
                        {l.nextMatchday && (
                          <p className="text-xs text-accent mt-2 font-medium">Next fixture: Matchday {l.nextMatchday}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className="text-[10px] text-muted-faint font-mono mb-1">Season progress</p>
                        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-soft mt-1">{l.completedFixtures}/{l.totalFixtures} matches</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-soft text-lg">No leagues found</p>
            <Link href="/leagues/create" className="btn-primary inline-flex mt-4 h-11 px-6 text-xs rounded-[16px]">Create the first league</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((league, i) => (
              <motion.div key={league.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link href={`/leagues/${league.id}`} className="block frosted-card p-5 rounded-[24px] hover:border-accent/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-[8px] text-[9px] font-bold uppercase tracking-wider" style={{
                      background: league.type === "PUBLIC" ? "rgba(0,255,133,0.08)" : "rgba(168,85,247,0.08)",
                      border: `1px solid ${league.type === "PUBLIC" ? "rgba(0,255,133,0.16)" : "rgba(168,85,247,0.16)"}`,
                      color: league.type === "PUBLIC" ? "#00ff85" : "#a855f7",
                    }}>{league.type}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${league.status === "LIVE" ? "text-accent" : league.status === "COMPLETED" ? "text-muted-faint" : "text-cyan"}`}>{league.status}</span>
                  </div>
                  <h3 className="cinematic-heading text-xl text-ink">{league.name}</h3>
                  {league.description && <p className="text-muted-soft text-xs mt-1 line-clamp-2">{league.description}</p>}
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

function FormIndicator({ form }: { form: string }) {
  return (
    <span className="inline-flex gap-0.5">
      {form.split("").slice(-5).map((r, i) => (
        <span key={i} className={`h-2 w-2 rounded-full ${r === "W" ? "bg-accent" : r === "D" ? "bg-gold" : r === "L" ? "bg-negative" : "bg-muted-faint"}`} />
      ))}
    </span>
  );
}
