"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "overview" | "matches" | "members" | "discipline" | "audit" | "fines" | "transfers" | "contracts" | "freeagents" | "activity" | "tools" | "governance" | "hof";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◉" },
  { id: "matches", label: "Matches", icon: "⚔" },
  { id: "members", label: "Members", icon: "👥" },
  { id: "discipline", label: "Discipline", icon: "⚖" },
  { id: "audit", label: "Audit Log", icon: "📋" },
  { id: "fines", label: "Fines", icon: "💰" },
  { id: "transfers", label: "Transfers", icon: "🔄" },
  { id: "contracts", label: "Contracts", icon: "📄" },
  { id: "freeagents", label: "Free Agents", icon: "🔍" },
  { id: "activity", label: "Activity", icon: "📊" },
  { id: "tools", label: "Tools", icon: "🔧" },
  { id: "governance", label: "Governance", icon: "🗳" },
  { id: "hof", label: "Hall of Fame", icon: "🏆" },
];

let n = 0;
const uuid = () => `${++n}`;
const now = () => new Date().toISOString();

export default function ControlTowerPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<string | null>(null);
  const [clubId, setClubId] = useState("");

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const fetchData = useCallback(async (view: string) => {
    try {
      const params = new URLSearchParams({ view });
      if (clubId) params.set("clubId", clubId);
      const res = await fetch(`/api/club/control-tower?${params}`);
      const d = await res.json();
      setData(prev => ({ ...prev, [view]: d }));
    } catch (e) { console.error(e); }
  }, [clubId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchData("overview"),
      fetchData("matches"),
      fetchData("members"),
      fetchData("disciplines"),
      fetchData("audit"),
      fetchData("freeagents"),
      fetchData("activity"),
    ]).finally(() => setLoading(false));
  }, [fetchData]);

  const cmd = async (action: string, payload: Record<string, any> = {}) => {
    try {
      const res = await fetch("/api/club/control-tower", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data: payload }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      notify("Done");
      fetchData(activeTab);
      return true;
    } catch (e: any) { notify(e.message); return false; }
  };

  if (loading) return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 300px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-soft">Operations Center</span>
          </div>
          <h1 className="cinematic-heading text-2xl sm:text-4xl text-ink mt-1">
            Club <span className="text-gradient-pink">Control Tower</span>
          </h1>
          <p className="mt-1 text-sm text-muted max-w-xl">Central command for club operations, match validation, discipline, transfers, and governance.</p>
          {clubId && <p className="text-xs text-accent mt-1 font-mono">Filtering by club: {clubId}</p>}
        </div>
      </div>

      <AnimatePresence>
        {notif && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-accent/90 text-black px-5 py-3 rounded-[14px] text-sm font-bold shadow-xl"
          >{notif}</motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-28">
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4 mt-2">
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); fetchData(t.id); }}
              className={`whitespace-nowrap px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === t.id ? "bg-accent text-black" : "text-muted-soft hover:text-ink bg-white/3 hover:bg-white/8"
              }`}
            ><span>{t.icon}</span> {t.label}</button>
          ))}
        </div>

        {/* Overview Dashboard */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard label="Clubs" value={data.overview?.clubs?.length ?? 0} color="accent" />
              <StatCard label="Members" value={data.members?.members?.length ?? 0} color="ink" />
              <StatCard label="Matches" value={data.matches?.matches?.length ?? 0} color="blue" />
              <StatCard label="Disciplines" value={data.disciplines?.disciplines?.length ?? 0} color="negative" />
              <StatCard label="Free Agents" value={data.freeagents?.agents?.length ?? 0} color="gold" />
              <StatCard label="Audit Entries" value={data.audit?.logs?.length ?? 0} color="ink" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Panel title="Recent Match Activity">
                {(data.matches?.matches ?? []).slice(0, 8).map((m: any) => (
                  <div key={m.id} className="flex justify-between items-center py-1.5 text-xs border-b border-border-faint last:border-0">
                    <span className="text-ink font-medium">{m.p1_name} vs {m.p2_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      m.status === "CONFIRMED" ? "text-accent" :
                      m.status === "PENDING" ? "text-yellow-400" :
                      m.status === "REJECTED" || m.status === "VOIDED" ? "text-negative" :
                      "text-muted-soft"
                    }`}>{m.status}</span>
                  </div>
                ))}
              </Panel>

              <Panel title="Recent Disciplinary Actions">
                {(data.disciplines?.disciplines ?? []).slice(0, 8).map((d: any) => (
                  <div key={d.id} className="flex justify-between items-center py-1.5 text-xs border-b border-border-faint last:border-0">
                    <span className="text-ink">{d.target_name || d.target_id?.slice(0, 8)} — <span className="text-muted-soft">{d.reason}</span></span>
                    <span className="text-negative font-bold text-[9px]">{d.action}</span>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        )}

        {/* Match Validation Center */}
        {activeTab === "matches" && (
          <Panel title="Match Validation Center">
            <p className="text-xs text-muted-soft mb-3">Approve, reject, void, or flag matches. Force results with manual override.</p>
            {(data.matches?.matches ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-white/3 mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink font-bold truncate">{m.p1_name} vs {m.p2_name}</p>
                  <p className="text-xs text-muted-soft">Score: {m.score_player1 || "?"}-{m.score_player2 || "?"} · {m.status}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => cmd("approve-match", { matchId: m.id })} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-accent/20 text-accent hover:bg-accent/30">✓</button>
                  <button onClick={() => cmd("reject-match", { matchId: m.id })} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-negative/20 text-negative hover:bg-negative/30">✗</button>
                  <button onClick={() => {const r=prompt("Reason:"); if(r)cmd("flag-match",{matchId:m.id,reason:r});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">⚠</button>
                  <button onClick={() => {const w=prompt("Winner ID:"); if(w)cmd("void-match",{matchId:m.id});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-white/10 text-muted-soft hover:bg-white/20">✕</button>
                </div>
              </div>
            ))}
          </Panel>
        )}

        {/* Members Management */}
        {activeTab === "members" && (
          <Panel title="Member Management">
            {(data.members?.members ?? []).map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-white/3 mb-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-muted-soft">{m.username?.[0] || "?"}</div>
                  <div>
                    <p className="text-sm text-ink font-bold">{m.displayName || m.username}</p>
                    <p className="text-[10px] text-muted-soft">{m.role} · {m.platform} · {m.country}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => {const r=prompt("Reason:"); cmd("warn",{targetId:m.user_id,reason:r||"No reason"});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-yellow-500/20 text-yellow-400">Warn</button>
                  <button onClick={() => {const r=prompt("Reason:"); cmd("suspend",{targetId:m.user_id,reason:r||""});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-orange-500/20 text-orange-400">Suspend</button>
                  <button onClick={() => {if(confirm("Ban this player?")) cmd("ban",{targetId:m.user_id});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-negative/20 text-negative">Ban</button>
                </div>
              </div>
            ))}
          </Panel>
        )}

        {/* Discipline */}
        {activeTab === "discipline" && (
          <Panel title="Player Discipline Center">
            <p className="text-xs text-muted-soft mb-3">All warnings, suspensions, bans, and strikes across the platform.</p>
            {(data.disciplines?.disciplines ?? []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-white/3 mb-1.5">
                <div>
                  <p className="text-sm text-ink font-bold">{d.target_name || d.target_id?.slice(0, 12)}</p>
                  <p className="text-xs text-muted-soft">{d.reason || "No reason"} · by {d.mod_name || d.moderator_id?.slice(0, 8)}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  d.action === "BAN" || d.action === "EMERGENCY_BAN" ? "bg-negative/20 text-negative" :
                  d.action === "SUSPEND" ? "bg-orange-500/20 text-orange-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>{d.action}</span>
              </div>
            ))}
          </Panel>
        )}

        {/* Audit Log */}
        {activeTab === "audit" && (
          <Panel title="Audit Log">
            <p className="text-xs text-muted-soft mb-3">Every admin action is permanently logged and cannot be deleted.</p>
            <div className="max-h-[600px] overflow-y-auto space-y-1">
              {(data.audit?.logs ?? []).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-1.5 px-3 rounded-[8px] text-xs bg-white/[0.02]">
                  <div className="flex-1">
                    <span className="text-ink font-bold">{l.action}</span>
                    <span className="text-muted-soft ml-2">{l.target}</span>
                    <span className="text-muted-faint ml-2">{l.details || ""}</span>
                  </div>
                  <span className="text-muted-faint text-[9px] ml-2">{l.username || l.admin_id?.slice(0, 6)} · {l.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Fines */}
        {activeTab === "fines" && (
          <Panel title="Club Fines">
            <div className="flex gap-2 mb-3">
              <input id="fineClubId" placeholder="Club ID" className="flex-1 px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5" />
              <input id="fineAmount" type="number" placeholder="Amount" className="w-24 px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5" />
              <input id="fineReason" placeholder="Reason" className="flex-1 px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5" />
              <button onClick={() => {
                const c = (document.getElementById("fineClubId") as HTMLInputElement)?.value;
                const a = parseInt((document.getElementById("fineAmount") as HTMLInputElement)?.value);
                const r = (document.getElementById("fineReason") as HTMLInputElement)?.value;
                if (c && a) cmd("fine-club", { clubId: c, amount: a, reason: r });
              }} className="px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent text-black">Issue Fine</button>
            </div>
          </Panel>
        )}

        {/* Transfers */}
        {activeTab === "transfers" && (
          <Panel title="Player Transfer System">
            <div className="flex gap-2 mb-3 flex-wrap">
              <input id="tfPlayer" placeholder="Player ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="tfFrom" placeholder="From Club ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="tfTo" placeholder="To Club ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <button onClick={() => {
                const p = (document.getElementById("tfPlayer") as HTMLInputElement)?.value;
                const f = (document.getElementById("tfFrom") as HTMLInputElement)?.value;
                const t = (document.getElementById("tfTo") as HTMLInputElement)?.value;
                if (p && f && t) cmd("create-transfer", { playerId: p, fromClubId: f, toClubId: t });
              }} className="px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent text-black">Request Transfer</button>
            </div>
          </Panel>
        )}

        {/* Contracts */}
        {activeTab === "contracts" && (
          <Panel title="Player Contracts">
            <div className="flex gap-2 mb-3 flex-wrap">
              <input id="ctPlayer" placeholder="Player ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="ctClub" placeholder="Club ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="ctDuration" type="number" placeholder="Months" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-24" />
              <button onClick={() => {
                const p = (document.getElementById("ctPlayer") as HTMLInputElement)?.value;
                const c = (document.getElementById("ctClub") as HTMLInputElement)?.value;
                const d = parseInt((document.getElementById("ctDuration") as HTMLInputElement)?.value);
                if (p && c && d) cmd("create-contract", { playerId: p, clubId: c, durationMonths: d });
              }} className="px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent text-black">Sign Contract</button>
            </div>
          </Panel>
        )}

        {/* Free Agents */}
        {activeTab === "freeagents" && (
          <Panel title="Free Agent Pool">
            {(data.freeagents?.agents ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-white/3 mb-1.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{a.username?.[0] || "?"}</div>
                  <div>
                    <p className="text-sm text-ink font-bold">{a.displayName || a.username}</p>
                    <p className="text-xs text-muted-soft">{a.preferred_role || "Open"} · {a.skill_rating || 0} SR · {a.wins || 0}W {a.losses || 0}L</p>
                  </div>
                </div>
              </div>
            ))}
          </Panel>
        )}

        {/* Activity */}
        {activeTab === "activity" && (
          <Panel title="Platform Activity">
            {(data.activity?.activity ?? []).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between py-1.5 px-3 rounded-[8px] text-xs bg-white/[0.02] mb-1">
                <span className="text-ink font-medium">{a.username}</span>
                <span className="text-muted-soft">{a.message || a.type}</span>
                <span className="text-muted-faint">{a.created_at?.slice(0, 10)}</span>
              </div>
            ))}
          </Panel>
        )}

        {/* Emergency Tools */}
        {activeTab === "tools" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Emergency Tools</h3>
              <div className="space-y-2">
                <button onClick={() => {const u=prompt("User ID to ban:"); const r=prompt("Reason:"); if(u)cmd("emergency-ban",{userId:u,reason:r||"Emergency"});}} className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-negative/20 text-negative hover:bg-negative/30">Emergency Ban Player</button>
                <button onClick={() => {const l=prompt("League ID:"); if(l)cmd("freeze-league",{leagueId:l});}} className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 hover:bg-orange-500/30">Freeze League</button>
                <button onClick={() => {const t=prompt("Tournament ID:"); if(t)cmd("shutdown-tournament",{tournamentId:t});}} className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-negative/20 text-negative hover:bg-negative/30">Shutdown Tournament</button>
              </div>
            </div>

            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Points Management</h3>
              <div className="space-y-2">
                <input id="ptsUser" placeholder="User ID" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 mb-1" />
                <input id="ptsAmount" type="number" placeholder="Amount" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 mb-1" />
                <input id="ptsReason" placeholder="Reason" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => {const u=(document.getElementById("ptsUser")as HTMLInputElement)?.value;const a=parseInt((document.getElementById("ptsAmount")as HTMLInputElement)?.value);const r=(document.getElementById("ptsReason")as HTMLInputElement)?.value;if(u&&a)cmd("award-points",{userId:u,points:a,reason:r});}} className="flex-1 px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent/20 text-accent">Award</button>
                  <button onClick={() => {const u=(document.getElementById("ptsUser")as HTMLInputElement)?.value;const a=parseInt((document.getElementById("ptsAmount")as HTMLInputElement)?.value);const r=(document.getElementById("ptsReason")as HTMLInputElement)?.value;if(u&&a)cmd("deduct-points",{userId:u,points:a,reason:r});}} className="flex-1 px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-negative/20 text-negative">Deduct</button>
                </div>
              </div>
            </div>

            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Club Alliances & Badges</h3>
              <div className="space-y-2">
                <input id="allianceClub" placeholder="Club ID" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 mb-1" />
                <input id="allianceTarget" placeholder="Allied Club ID" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 mb-2" />
                <button onClick={() => {const c=(document.getElementById("allianceClub")as HTMLInputElement)?.value;const a=(document.getElementById("allianceTarget")as HTMLInputElement)?.value;if(c&&a)cmd("create-alliance",{clubId:c,alliedClubId:a});}} className="w-full px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent/20 text-accent">Create Alliance</button>
                <select id="badgeType" className="w-full px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5">
                  <option value="DOMINANCE">Dominance</option>
                  <option value="SPORTSMANSHIP">Sportsmanship</option>
                  <option value="LEGACY">Legacy</option>
                  <option value="RIVALRY">Rivalry</option>
                  <option value="ACTIVITY">Activity</option>
                </select>
                <button onClick={() => {const c=(document.getElementById("allianceClub")as HTMLInputElement)?.value;const b=(document.getElementById("badgeType")as HTMLSelectElement)?.value;if(c&&b)cmd("award-badge",{clubId:c,badgeType:b});}} className="w-full px-3 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-gold/20 text-yellow-400">Award Badge</button>
              </div>
            </div>
          </div>
        )}

        {/* Governance / Voting */}
        {activeTab === "governance" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-2">Club Government — Create Vote</h3>
            <div className="flex gap-2 flex-wrap">
              <input id="voteClub" placeholder="Club ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="voteTitle" placeholder="Vote title" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 flex-1" />
              <input id="voteOptions" placeholder="Option1,Option2,Option3" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 flex-1" />
              <button onClick={() => {
                const c = (document.getElementById("voteClub") as HTMLInputElement)?.value;
                const t = (document.getElementById("voteTitle") as HTMLInputElement)?.value;
                const o = (document.getElementById("voteOptions") as HTMLInputElement)?.value?.split(",");
                if (c && t && o) cmd("create-vote", { clubId: c, title: t, options: o });
              }} className="px-4 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-accent text-black">Create Vote</button>
            </div>
          </div>
        )}

        {/* Hall of Fame */}
        {activeTab === "hof" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-2">Hall of Fame — Induct Legend</h3>
            <div className="flex gap-2 flex-wrap">
              <input id="hofPlayer" placeholder="Player ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="hofClub" placeholder="Club ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-40" />
              <input id="hofTitle" placeholder="Title (e.g. Club Legend)" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 flex-1" />
              <input id="hofAch" placeholder="Achievement" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 flex-1" />
              <button onClick={() => {
                const p = (document.getElementById("hofPlayer") as HTMLInputElement)?.value;
                const c = (document.getElementById("hofClub") as HTMLInputElement)?.value;
                const t = (document.getElementById("hofTitle") as HTMLInputElement)?.value;
                const a = (document.getElementById("hofAch") as HTMLInputElement)?.value;
                if (p && c) cmd("induct-legend", { playerId: p, clubId: c, title: t, achievement: a });
              }} className="px-4 py-2 rounded-[10px] text-[9px] font-bold uppercase bg-gold/20 text-yellow-400">Induct</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="glass rounded-[16px] p-4 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-1">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${color === "accent" ? "text-accent" : color === "negative" ? "text-negative" : color === "gold" ? "text-yellow-400" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-[24px] p-5">
      <h2 className="text-sm font-bold text-ink mb-3">{title}</h2>
      {children}
    </div>
  );
}
