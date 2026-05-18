"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Row = Record<string, unknown>;
type Section = "users" | "clubs" | "tournaments" | "leagues" | "matches" | "disputes" | "activity";

export default function CommandCenter() {
  const [data, setData] = useState<Record<string, Row[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Section>("users");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/command-center");
      const json = await res.json();
      setData(json);
    } catch { setFeedback("Failed to load"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const doAction = async (action: string, id: string, body: Record<string, unknown> = {}) => {
    try {
      const res = await fetch("/api/admin/command-center", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data: body }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback("Done");
        fetchAll();
      } else { setFeedback(json.error || "Failed"); }
    } catch { setFeedback("Request failed"); }
    setTimeout(() => setFeedback(null), 2000);
  };

  const counts = data?.counts as Record<string, number> | undefined;

  const tabs: { id: Section; label: string }[] = [
    { id: "users", label: `Users (${counts?.users ?? 0})` },
    { id: "clubs", label: `Clubs (${counts?.clubs ?? 0})` },
    { id: "tournaments", label: `Tournaments (${counts?.tournaments ?? 0})` },
    { id: "leagues", label: `Leagues (${counts?.leagues ?? 0})` },
    { id: "matches", label: `Matches (${counts?.matches ?? 0})` },
    { id: "disputes", label: `Disputes (${counts?.disputes ?? 0})` },
    { id: "activity", label: "Activity" },
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Command Center</h1>
          <p className="text-sm text-muted-soft mt-0.5">
            Full platform oversight — {data?.latency ? `${data.latency}ms` : "—"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {feedback && (
            <span className="text-[10px] font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full">
              {feedback}
            </span>
          )}
          <button onClick={fetchAll} className="h-8 w-8 rounded-[10px] border border-border-faint flex items-center justify-center hover:border-accent/20 transition-colors" title="Refresh">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-muted-soft"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          </button>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap flex-1 py-2 rounded-[10px] text-[9px] font-black tracking-[0.14em] uppercase transition-all ${
              tab === t.id ? "bg-accent/15 text-accent shadow-sm" : "text-muted-soft hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-faint">
          <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter..." className="w-full h-10 pl-9 pr-4 rounded-[12px] text-sm outline-none bg-bg-highlight/50 border border-border-faint text-ink" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
          {tab === "users" && <UsersTable rows={data?.users as Row[] || []} search={search} doAction={doAction} />}
          {tab === "clubs" && <ClubsTable rows={data?.clubs as Row[] || []} search={search} doAction={doAction} />}
          {tab === "tournaments" && <GenericTable title="Tournaments" rows={data?.tournaments as Row[] || []} search={search} />}
          {tab === "leagues" && <GenericTable title="Leagues" rows={data?.leagues as Row[] || []} search={search} />}
          {tab === "matches" && <GenericTable title="Matches" rows={data?.matches as Row[] || []} search={search} />}
          {tab === "disputes" && <GenericTable title="Disputes" rows={data?.disputes as Row[] || []} search={search} />}
          {tab === "activity" && <ActivityLog rows={data?.audits as Row[] || []} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function UsersTable({ rows, search, doAction }: { rows: Row[]; search: string; doAction: (a: string, id: string, body?: Record<string, unknown>) => void }) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");

  const filtered = rows.filter((r) =>
    !search || [r.username, r.email, r.displayName, r.role].some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-muted-faint text-[9px] uppercase tracking-wider border-b border-border-faint">
          <th className="text-left py-2 px-2 font-bold">Username</th>
          <th className="text-left py-2 px-2 font-bold">Email</th>
          <th className="text-left py-2 px-2 font-bold">Display</th>
          <th className="text-left py-2 px-2 font-bold">Role</th>
          <th className="text-left py-2 px-2 font-bold">Platform</th>
          <th className="text-left py-2 px-2 font-bold">Status</th>
          <th className="text-right py-2 px-2 font-bold">Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map((u) => (
            <tr key={u.id as string} className="border-b border-border-faint/50 hover:bg-bg-highlight/30 transition-colors">
              <td className="py-2.5 px-2 font-bold text-ink">{u.username as string}</td>
              <td className="py-2.5 px-2 text-muted-soft font-mono text-[10px]">{u.email as string}</td>
              <td className="py-2.5 px-2 text-muted-soft">{u.displayName as string}</td>
              <td className="py-2.5 px-2">
                {actionId === u.id ? (
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="bg-bg-highlight border border-border-faint rounded-[6px] px-1.5 py-0.5 text-[10px] text-ink outline-none"
                  >
                    <option value="PLAYER">PLAYER</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                ) : (
                  <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${
                    u.role === "ADMIN" ? "bg-gold/10 text-gold" : u.role === "MANAGER" ? "bg-accent/10 text-accent" : "bg-white/[0.04] text-muted-soft"
                  }`}>{u.role as string}</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-muted-soft">{(u.platform as string) || "—"}</td>
              <td className="py-2.5 px-2">
                <span className={`inline-flex items-center gap-1 ${
                  u.isBanned ? "text-negative" : "text-accent"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${u.isBanned ? "bg-negative" : "bg-accent"}`} />
                  <span className="text-[9px] font-bold">{u.isBanned ? "BANNED" : "ACTIVE"}</span>
                </span>
              </td>
              <td className="py-2.5 px-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {actionId === u.id ? (
                    <>
                      <button onClick={() => { doAction("updateUserRole", u.id as string, { role: newRole }); setActionId(null); }}
                        className="px-2 py-1 rounded-[6px] text-[9px] font-bold bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                      >Save</button>
                      <button onClick={() => setActionId(null)}
                        className="px-2 py-1 rounded-[6px] text-[9px] font-bold text-muted-soft hover:text-ink transition-colors"
                      >Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setActionId(u.id as string); setNewRole(u.role as string); }}
                        className="px-2 py-1 rounded-[6px] text-[9px] font-bold bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >Edit</button>
                      <button onClick={() => doAction("banUser", u.id as string, { ban: !u.isBanned })}
                        className={`px-2 py-1 rounded-[6px] text-[9px] font-bold transition-colors ${
                          u.isBanned ? "bg-accent/10 text-accent hover:bg-accent/20" : "bg-negative/10 text-negative hover:bg-negative/20"
                        }`}
                      >{u.isBanned ? "Unban" : "Ban"}</button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-center text-muted-soft text-xs py-8">No users found</p>}
    </div>
  );
}

function ClubsTable({ rows, search, doAction }: { rows: Row[]; search: string; doAction: (a: string, id: string, body?: Record<string, unknown>) => void }) {
  const filtered = rows.filter((r) =>
    !search || [r.name, r.slug, r.tag, r.status].some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-muted-faint text-[9px] uppercase tracking-wider border-b border-border-faint">
          <th className="text-left py-2 px-2 font-bold">Name</th>
          <th className="text-left py-2 px-2 font-bold">Slug</th>
          <th className="text-left py-2 px-2 font-bold">Tag</th>
          <th className="text-left py-2 px-2 font-bold">Status</th>
          <th className="text-left py-2 px-2 font-bold">Platform</th>
          <th className="text-left py-2 px-2 font-bold">Verified</th>
          <th className="text-right py-2 px-2 font-bold">Actions</th>
        </tr></thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id as string} className="border-b border-border-faint/50 hover:bg-bg-highlight/30 transition-colors">
              <td className="py-2.5 px-2 font-bold text-ink">{c.name as string}</td>
              <td className="py-2.5 px-2 text-muted-soft font-mono text-[10px]">{c.slug as string}</td>
              <td className="py-2.5 px-2 text-muted-soft">{c.tag ? `[${c.tag}]` : "—"}</td>
              <td className="py-2.5 px-2">
                <select value={c.status as string} onChange={(e) => doAction("updateClubStatus", c.id as string, { status: e.target.value })}
                  className="bg-bg-highlight border border-border-faint rounded-[6px] px-1.5 py-0.5 text-[10px] text-ink outline-none"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </td>
              <td className="py-2.5 px-2 text-muted-soft">{(c.platform as string) || "—"}</td>
              <td className="py-2.5 px-2">
                <span className={`text-[9px] font-bold ${c.isVerified ? "text-accent" : "text-muted-faint"}`}>
                  {c.isVerified ? "YES" : "NO"}
                </span>
              </td>
              <td className="py-2.5 px-2 text-right">
                <button onClick={() => doAction("deleteClub", c.id as string)}
                  className="px-2 py-1 rounded-[6px] text-[9px] font-bold bg-negative/10 text-negative hover:bg-negative/20 transition-colors"
                >Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-center text-muted-soft text-xs py-8">No clubs found</p>}
    </div>
  );
}

function GenericTable({ title, rows, search }: { title: string; rows: Row[]; search: string }) {
  const keys = rows.length > 0 ? Object.keys(rows[0]).filter((k) => k !== "id") : [];
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="text-muted-faint text-[9px] uppercase tracking-wider border-b border-border-faint">
          {keys.map((k) => <th key={k} className="text-left py-2 px-2 font-bold whitespace-nowrap">{k}</th>)}
        </tr></thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={r.id as string ?? i} className="border-b border-border-faint/50 hover:bg-bg-highlight/30 transition-colors">
              {keys.map((k) => (
                <td key={k} className="py-2.5 px-2 text-muted-soft max-w-[200px] truncate">
                  {String(r[k] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && <p className="text-center text-muted-soft text-xs py-8">No {title.toLowerCase()} found</p>}
    </div>
  );
}

function ActivityLog({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-1">
      {rows.length === 0 ? (
        <p className="text-center text-muted-soft text-xs py-8">No activity recorded</p>
      ) : (
        rows.map((r, i) => (
          <div key={r.id as string ?? i} className="flex items-center gap-3 px-3 py-2 rounded-[10px] bg-bg-highlight/20 text-xs">
            <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
            <span className="font-mono text-[10px] text-muted-faint shrink-0">{String(r.createdAt ?? "").slice(0, 10)}</span>
            <span className="text-ink font-bold">{r.action as string}</span>
            <span className="text-muted-soft">on</span>
            <span className="text-muted-soft font-mono">{r.target as string}</span>
            {r.adminId && <span className="text-muted-faint text-[9px] ml-auto">by {String(r.adminId).slice(0, 8)}</span>}
          </div>
        ))
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div className="h-8 w-8 rounded-full border-2 border-accent border-t-transparent"
          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <p className="text-sm text-muted-soft font-mono">Loading command center...</p>
      </div>
    </div>
  );
}
