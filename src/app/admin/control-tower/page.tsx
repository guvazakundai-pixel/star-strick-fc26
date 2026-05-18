"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

type ModelInfo = { name: string; count: number };
type ModelGroup = { group: string; models: ModelInfo[] };
type EnvCheck = { key: string; set: boolean; inVercel: boolean };
type Self = {
  username: string;
  role: string;
  elo: number;
  points: number;
  level: { level: number; pct: number; needed: number };
  division: { tier: string; label: string };
  nextDivision: { pct: number; needed: number };
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  formHistory: string;
  rankPosition: number | null;
  achievementCount: number;
};
type TowerData = {
  status: "healthy" | "degraded";
  timestamp: string;
  db: { latency: number; totalModels: number; resolvedModels: number; failedModels: number };
  pulse: {
    newUsers24h: number;
    newMatches1h: number;
    pendingMatches: number;
    openDisputes: number;
    pendingManagerApps: number;
    pendingReports: number;
    activeLeagues: number;
    liveTournaments: number;
  };
  self: Self | null;
  recentRegistrations: { username: string; displayName: string | null; country: string | null; createdAt: string }[];
  recentMatches: { id: string; player1: string; player2: string; score: string; status: string; createdAt: string }[];
  recentAudits: { id: string; action: string; target: string; admin: string; createdAt: string }[];
  topGainers: { userId: string; username: string; displayName: string | null; points: number }[];
  env: EnvCheck[];
  platform: { node: string; runtime: string; region: string; vercelEnv: string };
  groups: ModelGroup[];
  errors?: string[];
};

export default function ControlTower() {
  const [data, setData] = useState<TowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/control-tower");
      if (!res.ok) { setError(`API returned ${res.status}`); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-sm text-muted-soft font-mono">Booting control tower…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="frosted-card-sm p-8 text-center max-w-md">
          <p className="text-ink font-bold mb-2">Connection Lost</p>
          <p className="text-sm text-muted-soft mb-4 font-mono">{error}</p>
          <button onClick={fetchData} className="btn-primary inline-flex items-center justify-center h-10 px-5 rounded-[12px] text-xs font-bold">Reconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Control Tower</h1>
          <p className="text-sm text-muted-soft mt-1">Everything, one place. Refreshes every 30s.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={data.status} />
          <button
            onClick={fetchData}
            className="h-9 w-9 rounded-[10px] border border-border-faint bg-bg-elevated/50 flex items-center justify-center hover:border-accent/20 transition-colors"
            title="Refresh"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-muted-soft">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Live Pulse */}
      <Section title="Live Pulse" subtitle="Last 60 minutes & 24 hours">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PulseCard label="New Users (24h)" value={data.pulse.newUsers24h} tone="accent" />
          <PulseCard label="Matches (1h)" value={data.pulse.newMatches1h} tone="accent" />
          <PulseCard label="Pending Matches" value={data.pulse.pendingMatches} tone={data.pulse.pendingMatches > 5 ? "gold" : "muted"} />
          <PulseCard label="Open Disputes" value={data.pulse.openDisputes} tone={data.pulse.openDisputes > 0 ? "danger" : "accent"} />
          <PulseCard label="Active Leagues" value={data.pulse.activeLeagues} tone="accent" />
          <PulseCard label="Live Tournaments" value={data.pulse.liveTournaments} tone="accent" />
          <PulseCard label="Manager Apps" value={data.pulse.pendingManagerApps} tone={data.pulse.pendingManagerApps > 0 ? "gold" : "muted"} />
          <PulseCard label="Pending Reports" value={data.pulse.pendingReports} tone={data.pulse.pendingReports > 0 ? "gold" : "muted"} />
        </div>
      </Section>

      {/* Self View (the admin as a player) */}
      {data.self && (
        <Section title={`Your Profile — @${data.self.username}`} subtitle="Player snapshot, ranked alongside everyone else">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="frosted-card p-5 rounded-[22px] space-y-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Division</p>
                  <p className="text-2xl font-display text-ink">{data.self.division.label}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">ELO</p>
                  <p className="text-3xl font-display text-accent tabular-nums">{data.self.elo}</p>
                </div>
              </div>
              <Bar label={`Toward next division`} pct={data.self.nextDivision.pct} hint={`${data.self.nextDivision.needed} ELO to go`} />
              <Bar label={`Level ${data.self.level.level}`} pct={data.self.level.pct} hint={`${data.self.level.needed} pts to L${data.self.level.level + 1}`} />
              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="Played" value={data.self.matchesPlayed} />
                <Stat label="W" value={data.self.wins} tone="accent" />
                <Stat label="D" value={data.self.draws} />
                <Stat label="L" value={data.self.losses} tone="danger" />
              </div>
            </div>
            <div className="frosted-card p-5 rounded-[22px] space-y-3">
              <div className="flex justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Global Rank</span>
                <span className="text-ink font-mono tabular-nums">#{data.self.rankPosition ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Win Streak</span>
                <span className="text-ink font-mono tabular-nums">{data.self.winStreak}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Achievements</span>
                <span className="text-ink font-mono tabular-nums">{data.self.achievementCount}</span>
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft mb-1">Recent Form</p>
                <div className="font-mono text-lg tracking-wider">
                  {data.self.formHistory.slice(0, 10).split("").map((c, i) => (
                    <span key={i} className={c === "W" ? "text-emerald" : c === "L" ? "text-accent" : "text-muted-soft"}>
                      {c}
                    </span>
                  ))}
                  {data.self.formHistory.length === 0 && <span className="text-muted-soft text-xs">No matches yet</span>}
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Ops Queue */}
      <Section title="Ops Queue" subtitle="What needs your attention">
        <div className="grid gap-4 lg:grid-cols-3">
          <QueueCard
            title="Pending Matches"
            count={data.pulse.pendingMatches}
            href="/admin/command-center?tab=matches"
            tone={data.pulse.pendingMatches > 0 ? "gold" : "muted"}
          />
          <QueueCard
            title="Open Disputes"
            count={data.pulse.openDisputes}
            href="/admin/disputes"
            tone={data.pulse.openDisputes > 0 ? "danger" : "muted"}
          />
          <QueueCard
            title="Manager Applications"
            count={data.pulse.pendingManagerApps}
            href="/admin/command-center?tab=applications"
            tone={data.pulse.pendingManagerApps > 0 ? "gold" : "muted"}
          />
        </div>
      </Section>

      {/* Activity */}
      <Section title="Activity Stream" subtitle="Latest registrations, matches, admin actions">
        <div className="grid gap-4 lg:grid-cols-3">
          <ListCard title="New Registrations (24h)">
            {data.recentRegistrations.length === 0 ? (
              <Empty />
            ) : (
              data.recentRegistrations.map((u, i) => (
                <Row key={i} primary={`@${u.username}`} secondary={u.country ?? "—"} timestamp={u.createdAt} />
              ))
            )}
          </ListCard>
          <ListCard title="Recent Matches (1h)">
            {data.recentMatches.length === 0 ? (
              <Empty />
            ) : (
              data.recentMatches.map((m) => (
                <Row
                  key={m.id}
                  primary={`@${m.player1} ${m.score} @${m.player2}`}
                  secondary={m.status}
                  timestamp={m.createdAt}
                />
              ))
            )}
          </ListCard>
          <ListCard title="Admin Audit Log">
            {data.recentAudits.length === 0 ? (
              <Empty />
            ) : (
              data.recentAudits.map((a) => (
                <Row
                  key={a.id}
                  primary={a.action}
                  secondary={`by @${a.admin} on ${a.target.slice(0, 20)}`}
                  timestamp={a.createdAt}
                />
              ))
            )}
          </ListCard>
        </div>
      </Section>

      {/* Top XP Gainers */}
      {data.topGainers.length > 0 && (
        <Section title="Top XP Gainers (24h)" subtitle="Who's been grinding">
          <div className="frosted-card p-4 rounded-[22px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-soft">
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Player</th>
                  <th className="px-3 py-2 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {data.topGainers.map((g, i) => (
                  <tr key={g.userId} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 text-muted-soft font-mono">{i + 1}</td>
                    <td className="px-3 py-2 text-ink">@{g.username}</td>
                    <td className="px-3 py-2 text-right font-mono text-accent tabular-nums">+{g.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* System Health */}
      <Section title="System Health" subtitle={`DB ${data.db.latency}ms · ${data.db.resolvedModels}/${data.db.totalModels} models healthy`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="frosted-card p-5 rounded-[22px]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">Database Models</h3>
            <div className="space-y-1">
              {data.groups.map((g) => (
                <div key={g.group}>
                  <button
                    onClick={() => setExpandedGroup(expandedGroup === g.group ? null : g.group)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-[10px] hover:bg-bg-highlight/50 transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink">{g.group}</span>
                    <span className="text-[10px] font-mono text-muted-faint">{g.models.length} tables</span>
                  </button>
                  {expandedGroup === g.group && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden pl-4">
                      {g.models.map((m) => (
                        <div key={m.name} className="flex items-center justify-between px-3 py-1.5 rounded-[8px] text-[12px]">
                          <span className="text-muted-soft font-mono">{m.name}</span>
                          <span className={`font-mono tabular-nums ${m.count >= 0 ? "text-ink" : "text-negative"}`}>
                            {m.count >= 0 ? m.count.toLocaleString() : "ERR"}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="frosted-card p-5 rounded-[22px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-4">Environment</h3>
              <div className="space-y-2">
                {data.env.map((e) => (
                  <div key={e.key} className="flex items-center justify-between px-3 py-2 rounded-[10px] bg-bg-highlight/30">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${e.set ? "bg-accent" : "bg-negative"}`} />
                      <span className="text-xs font-mono text-muted-soft">{e.key}</span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${e.set ? "text-accent" : "text-negative"}`}>
                      {e.set ? "set" : "missing"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {data.errors && (
              <div className="frosted-card p-5 rounded-[22px] border border-negative/20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-negative mb-3">Errors</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {data.errors.map((err, i) => (
                    <div key={i} className="px-3 py-2 rounded-[8px] bg-negative/5 text-xs font-mono text-negative/80 break-all">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Action Hub */}
      <Section title="Action Hub" subtitle="Jump anywhere">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <ActionButton label="Command Center" href="/admin/command-center" />
          <ActionButton label="Users" href="/admin/users" />
          <ActionButton label="Disputes" href="/admin/disputes" />
          <ActionButton label="Rankings" href="/admin/rankings" />
          <ActionButton label="Leagues" href="/leagues" />
          <ActionButton label="Tournaments" href="/tournaments" />
          <ActionButton label="Reports" href="/admin/command-center?tab=disputes" />
          <ActionButton label="Members" href="/admin/members" />
          <ActionButton label="Settings" href="/admin/settings" />
          <ActionButton label="Points" href="/admin/points" />
          <ActionButton label="Media" href="/admin/media" />
          <ActionButton label="My Dashboard" href="/dashboard" />
        </div>
      </Section>

      <div className="text-center py-4">
        <p className="text-[9px] font-mono text-muted-faint">
          Last updated: {new Date(data.timestamp).toLocaleString()} · ZIM FCPRO Control Tower v2
        </p>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-muted-soft font-mono mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === "healthy";
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${ok ? "bg-accent/10 text-accent" : "bg-negative/10 text-negative"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-accent live-ring" : "bg-negative"}`} />
      {status}
    </span>
  );
}

function PulseCard({ label, value, tone }: { label: string; value: number; tone: "accent" | "gold" | "danger" | "muted" }) {
  const colors: Record<string, string> = {
    accent: "text-accent",
    gold: "text-gold",
    danger: "text-negative",
    muted: "text-ink",
  };
  return (
    <div className="frosted-card-sm p-4 rounded-[16px]">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-faint">{label}</p>
      <p className={`text-2xl font-black mt-1 tabular-nums ${colors[tone]}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function Bar({ label, pct, hint }: { label: string; pct: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">{label}</span>
        <span className="text-[10px] font-mono text-muted-soft">{hint}</span>
      </div>
      <div className="h-2 rounded-full bg-bg-highlight/60 overflow-hidden">
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "accent" | "danger" }) {
  const color = tone === "accent" ? "text-emerald" : tone === "danger" ? "text-accent" : "text-ink";
  return (
    <div>
      <p className={`text-2xl font-display tabular-nums ${color}`}>{value}</p>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">{label}</p>
    </div>
  );
}

function QueueCard({ title, count, href, tone }: { title: string; count: number; href: string; tone: "danger" | "gold" | "muted" }) {
  const colors: Record<string, string> = {
    danger: "border-negative/30 bg-negative/5",
    gold: "border-gold/30 bg-gold/5",
    muted: "border-border bg-bg-elevated/30",
  };
  const valueColor: Record<string, string> = {
    danger: "text-negative",
    gold: "text-gold",
    muted: "text-muted-soft",
  };
  return (
    <a href={href} className={`block border ${colors[tone]} rounded-[16px] p-4 hover:border-accent/30 transition-all`}>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-soft">{title}</p>
      <p className={`text-3xl font-black mt-1 tabular-nums ${valueColor[tone]}`}>{count}</p>
      <p className="text-[10px] text-muted-soft font-mono mt-2">View →</p>
    </a>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="frosted-card p-4 rounded-[22px]">
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-soft mb-3">{title}</h3>
      <div className="space-y-1 max-h-72 overflow-y-auto">{children}</div>
    </div>
  );
}

function Row({ primary, secondary, timestamp }: { primary: string; secondary: string; timestamp: string }) {
  return (
    <div className="flex items-center justify-between px-2 py-2 rounded-[8px] hover:bg-bg-highlight/40 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink truncate">{primary}</p>
        <p className="text-[10px] text-muted-soft font-mono truncate">{secondary}</p>
      </div>
      <span className="text-[10px] text-muted-faint font-mono ml-2 shrink-0">{relativeTime(timestamp)}</span>
    </div>
  );
}

function Empty() {
  return <p className="text-xs text-muted-soft py-4 text-center font-mono">No activity</p>;
}

function ActionButton({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} className="block px-3 py-3 rounded-[12px] border border-border-faint hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 text-center">
      <p className="text-xs font-bold text-ink">{label}</p>
    </a>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
