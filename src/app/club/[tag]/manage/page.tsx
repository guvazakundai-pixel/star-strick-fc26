"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Club = Record<string, unknown>;
type Member = Record<string, unknown>;
type Application = Record<string, unknown>;

type Tab = "overview" | "members" | "recruitment" | "rivalries" | "seasons" | "tournaments" | "leagues" | "training" | "announcements" | "analytics";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "members", label: "Members" },
  { id: "recruitment", label: "Recruitment" },
  { id: "rivalries", label: "Rivalries" },
  { id: "seasons", label: "Seasons" },
  { id: "tournaments", label: "Tournaments" },
  { id: "leagues", label: "Leagues" },
  { id: "training", label: "Training" },
  { id: "announcements", label: "Announcements" },
  { id: "analytics", label: "Analytics" },
];

const ROLE_HIERARCHY = ["OWNER", "CO_OWNER", "GM", "COACH", "CAPTAIN", "ASST_CAPTAIN", "SCOUT", "MODERATOR", "PRO_PLAYER", "ACADEMY", "TRIAL", "CONTENT_CREATOR"];

export default function ClubManagePage() {
  const params = useParams();
  const router = useRouter();
  const tag = params.tag as string;

  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [myRole, setMyRole] = useState<string>("");
  const [notif, setNotif] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown>>({});
  const [rivalries, setRivalries] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [leagues, setLeagues] = useState<any[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);

  const canManage = ["OWNER", "CO_OWNER", "GM", "CAPTAIN"].includes(myRole);

  useEffect(() => {
    if (!tag) return;
    const load = async () => {
      try {
        const clubsRes = await fetch(`/api/clubs?q=${encodeURIComponent(tag)}&limit=50`);
        const clubsData = await clubsRes.json();
        const found = (clubsData.clubs ?? []).find((c: any) => c.slug === tag || c.tag === tag.toUpperCase());
        if (!found) { setLoading(false); return; }

        const clubId = found.id;
        const manageRes = await fetch(`/api/club/manage?clubId=${clubId}`);
        const manageData = await manageRes.json();
        setClub(manageData.club);
        setMembers(manageData.members ?? []);
        setApplications(manageData.applications ?? []);

        const me = (manageData.members ?? []).find((m: any) => m.user_id === "me");

        const [analyticsRes, rivalsRes, trainRes, tournRes, leagueRes, seasonRes] = await Promise.all([
          fetch(`/api/club/analytics?clubId=${clubId}`),
          fetch(`/api/club/rivalries?clubId=${clubId}`),
          fetch(`/api/club/training?clubId=${clubId}`),
          fetch(`/api/club/tournament?clubId=${clubId}`),
          fetch(`/api/club/internal-league?clubId=${clubId}`),
          fetch(`/api/club/seasons?clubId=${clubId}`),
        ]);
        setAnalytics(await analyticsRes.json());
        setRivalries((await rivalsRes.json()).rivalries ?? []);
        const td = await trainRes.json();
        setSessions(td.sessions ?? []);
        setAnnouncements(td.announcements ?? []);
        setTournaments((await tournRes.json()).tournaments ?? []);
        setLeagues((await leagueRes.json()).leagues ?? []);
        setSeasons((await seasonRes.json()).seasons ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tag]);

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  const cmd = async (action: string, data: Record<string, unknown> = {}) => {
    try {
      const res = await fetch(`/api/club/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: club?.id, action, data }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      notify("Done");
      return true;
    } catch (e: any) { notify(e.message); return false; }
  };

  if (loading) return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
    </div>
  );
  if (!club) return (
    <div className="broadcast-theme min-h-screen bc-noise flex items-center justify-center">
      <div className="text-center glass p-8 rounded-[24px]">
        <p className="text-ink text-lg font-bold">Club not found</p>
        <p className="text-muted text-sm mt-2">No club matches "{tag}"</p>
        <Link href="/clubs" className="btn-primary mt-4 inline-flex px-4 py-2 rounded-[12px] text-xs font-bold text-black">Browse Clubs</Link>
      </div>
    </div>
  );

  const clubId = club.id as string;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 300px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <Link href={`/club/${tag}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-soft hover:text-accent transition-colors">← Back to Club</Link>
          </div>
          <h1 className="cinematic-heading text-2xl sm:text-4xl text-ink mt-1.5">
            {club.name as string} <span className="text-muted-soft">Management</span>
          </h1>
          <p className="mt-1 text-sm text-muted">Full control panel for your esports organization</p>
        </div>
      </div>

      <AnimatePresence>
        {notif && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-accent/90 text-black px-5 py-3 rounded-[14px] text-sm font-bold shadow-xl"
          >{notif}</motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28">
        <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${activeTab === t.id ? "bg-accent text-black" : "text-muted-soft hover:text-ink bg-white/3 hover:bg-white/8"}`}
            >{t.label}</button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Members" value={(analytics.members as any)?.total ?? 0} icon={<UsersIcon />} />
              <StatCard label="Active" value={(analytics.members as any)?.active ?? 0} icon={<ActiveIcon />} />
              <StatCard label="Matches" value={(analytics.matches as any)?.total ?? 0} icon={<MatchIcon />} />
              <StatCard label="Seasons" value={analytics.seasons as number ?? 0} icon={<SeasonIcon />} />
              <StatCard label="Rivalries" value={rivalries.length} icon={<RivalryIcon />} />
              <StatCard label="Pending Apps" value={analytics.pendingApplications as number ?? 0} icon={<PendingIcon />} />
              <StatCard label="Training" value={analytics.trainingSessions as number ?? 0} icon={<TrainingIcon />} />
              <StatCard label="Tournaments" value={tournaments.length} icon={<TrophyIcon />} />
            </div>

            <div className="glass rounded-[24px] p-5 space-y-3">
              <h3 className="text-sm font-bold text-ink">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveTab("announcements")} className="px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">Post Announcement</button>
                <button onClick={() => setActiveTab("tournaments")} className="px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">Create Tournament</button>
                <button onClick={() => setActiveTab("members")} className="px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">Manage Members</button>
                <button onClick={() => setActiveTab("recruitment")} className="px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">Recruitment</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="space-y-4">
            {applications.length > 0 && (
              <div className="glass rounded-[24px] p-5">
                <h3 className="text-sm font-bold text-ink mb-3">Pending Applications ({applications.length})</h3>
                <div className="space-y-2">
                  {applications.map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div>
                        <p className="text-sm text-ink font-bold">{app.username || app.displayName}</p>
                        <p className="text-xs text-muted-soft">{app.preferred_role || "No role specified"}{app.message ? ` · "${app.message}"` : ""}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => cmd("approve", { applicationId: app.id, role: "TRIAL" })} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">Accept</button>
                        <button onClick={() => cmd("reject", { applicationId: app.id })} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-muted-soft bg-white/5">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-3">Members ({members.length})</h3>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-[14px]" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div className="flex items-center gap-3">
                      {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-white/10" />}
                      <div>
                        <p className="text-sm text-ink font-bold">{m.username || m.displayName}</p>
                        <p className="text-xs text-muted-soft">{m.role} · {m.title || ""}</p>
                      </div>
                    </div>
                    {canManage && m.role !== "OWNER" && (
                      <div className="flex gap-1">
                        {["OWNER", "CO_OWNER"].includes(myRole) && (
                          <>
                            <button onClick={() => cmd("promote", { targetId: m.user_id })} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-white/5 text-accent hover:bg-white/10">Promote</button>
                            <button onClick={() => cmd("demote", { targetId: m.user_id })} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-white/5 text-muted-soft hover:bg-white/10">Demote</button>
                          </>
                        )}
                        <button onClick={() => cmd("kick", { targetId: m.user_id })} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-negative/10 text-negative hover:bg-negative/20">Kick</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "recruitment" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Recruitment</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href={`/club/${tag}/manage?tab=members`} className="p-4 rounded-[14px] bg-white/3 hover:bg-white/5 transition-colors">
                <p className="text-xs font-bold text-ink">Pending Applications</p>
                <p className="text-lg font-bold text-accent">{applications.length}</p>
              </Link>
              <a href={`/clubs?q=${tag}`} className="p-4 rounded-[14px] bg-white/3 hover:bg-white/5 transition-colors block">
                <p className="text-xs font-bold text-ink">Player Search</p>
                <p className="text-sm text-muted-soft">Find free agents and scout</p>
              </a>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <input id="inviteInput" placeholder="User ID to invite..." className="flex-1 px-4 py-2.5 rounded-[14px] text-sm text-ink outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} />
                <button onClick={() => { const v = (document.getElementById("inviteInput") as HTMLInputElement)?.value; if (v) cmd("invite", { inviteeId: v }); }} className="px-4 py-2.5 rounded-[14px] text-[10px] font-bold uppercase text-black bg-accent">Invite</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "rivalries" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Rivalries</h3>
            {rivalries.length === 0 ? (
              <p className="text-sm text-muted-soft">No rivalries yet. Play matches against other clubs to develop rivalries.</p>
            ) : (
              <div className="space-y-2">
                {rivalries.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-[14px] bg-white/3">
                    <div>
                      <p className="text-sm text-ink font-bold">
                        {r.club1_id === clubId ? r.club2_name : r.club1_name}
                        <span className="text-muted-soft text-xs ml-2">[{r.club1_id === clubId ? r.club2_slug : r.club1_slug}]</span>
                      </p>
                      <p className="text-xs text-muted-soft">
                        {r.club1_id === clubId ? r.club1_wins : r.club2_wins}W - {r.draws}D - {r.club1_id === clubId ? r.club2_wins : r.club1_wins}L
                      </p>
                    </div>
                    <span className="text-xs text-muted-soft">Score: {r.rivalry_score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "seasons" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-ink">Seasons</h3>
              {canManage && (
                <button onClick={() => cmd("create", { clubId, name: `Season ${seasons.length + 1}` })} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">New Season</button>
              )}
            </div>
            {seasons.length === 0 ? (
              <p className="text-sm text-muted-soft">No seasons recorded. Start your first season.</p>
            ) : (
              <div className="space-y-2">
                {seasons.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-[14px] bg-white/3">
                    <div>
                      <p className="text-sm text-ink font-bold">{s.name}</p>
                      <p className="text-xs text-muted-soft">S{s.season_number} · {s.status}</p>
                    </div>
                    <span className="text-xs text-muted-soft">{s.started_at?.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tournaments" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-ink">Internal Tournaments</h3>
              {canManage && (
                <button onClick={async () => {
                  const name = prompt("Tournament name:");
                  if (name) await fetch("/api/club/tournament", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", data: { clubId, name, format: "KNOCKOUT" } }) });
                }} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">Create</button>
              )}
            </div>
            {tournaments.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-[14px] bg-white/3">
                <div>
                  <p className="text-sm text-ink font-bold">{t.name}</p>
                  <p className="text-xs text-muted-soft">{t.format} · {t.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "leagues" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-ink">Internal Leagues</h3>
              {canManage && (
                <button onClick={async () => {
                  const name = prompt("League name:");
                  if (name) await fetch("/api/club/internal-league", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", data: { clubId, name } }) });
                }} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">Create</button>
              )}
            </div>
            {leagues.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between p-3 rounded-[14px] bg-white/3">
                <div>
                  <p className="text-sm text-ink font-bold">{l.name}</p>
                  <p className="text-xs text-muted-soft">{l.status} · {l.max_players} players</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "training" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-ink">Training Sessions</h3>
              {canManage && (
                <button onClick={async () => {
                  const title = prompt("Session title:");
                  if (title) await fetch("/api/club/training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create-training", data: { clubId, title, scheduledAt: new Date().toISOString() } }) });
                }} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">Schedule</button>
              )}
            </div>
            {sessions.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-[14px] bg-white/3">
                <div>
                  <p className="text-sm text-ink font-bold">{s.title}</p>
                  <p className="text-xs text-muted-soft">{s.type} · {s.status} · {s.scheduled_at?.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "announcements" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Announcements</h3>
            {canManage && (
              <div className="space-y-2 p-3 rounded-[14px] bg-white/3">
                <input id="annTitle" placeholder="Title" className="w-full px-4 py-2 rounded-[10px] text-sm text-ink outline-none bg-white/5" />
                <textarea id="annContent" placeholder="Content" className="w-full px-4 py-2 rounded-[10px] text-sm text-ink outline-none bg-white/5 resize-none" rows={3} />
                <button onClick={() => {
                  const t = (document.getElementById("annTitle") as HTMLInputElement)?.value;
                  const c = (document.getElementById("annContent") as HTMLTextAreaElement)?.value;
                  if (t && c) cmd("announce", { title: t, content: c });
                }} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase text-black bg-accent">Post</button>
              </div>
            )}
            {announcements.map((a: any) => (
              <div key={a.id} className="p-4 rounded-[14px] bg-white/3">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-ink font-bold">{a.title}</p>
                  {!!a.pinned && <span className="text-[9px] uppercase tracking-wider text-accent font-bold">Pinned</span>}
                </div>
                <p className="text-xs text-muted mt-1">{a.content}</p>
                <p className="text-[10px] text-muted-soft mt-2">{a.username} · {a.created_at?.slice(0, 10)}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="glass rounded-[24px] p-5 space-y-4">
            <h3 className="text-sm font-bold text-ink">Analytics</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-[14px] bg-white/3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Members</p>
                <p className="text-2xl font-bold text-ink">{(analytics.members as any)?.active ?? 0} / {(analytics.members as any)?.total ?? 0}</p>
                <p className="text-xs text-muted-soft">active / total</p>
              </div>
              <div className="p-4 rounded-[14px] bg-white/3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Matches</p>
                <p className="text-2xl font-bold text-ink">{(analytics.matches as any)?.completed ?? 0} / {(analytics.matches as any)?.total ?? 0}</p>
                <p className="text-xs text-muted-soft">completed / total</p>
              </div>
              <div className="p-4 rounded-[14px] bg-white/3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Applications</p>
                <p className="text-2xl font-bold text-ink">{analytics.pendingApplications as number ?? 0}</p>
                <p className="text-xs text-muted-soft">pending approval</p>
              </div>
              <div className="p-4 rounded-[14px] bg-white/3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Seasons</p>
                <p className="text-2xl font-bold text-ink">{analytics.seasons as number ?? 0}</p>
                <p className="text-xs text-muted-soft">total seasons</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass rounded-[16px] p-4">
      <div className="flex items-center gap-2 text-muted-soft mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-ink tabular-nums">{value}</p>
    </div>
  );
}

function UsersIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function ActiveIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>; }
function MatchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" x2="3" y1="12" y2="12" /></svg>; }
function SeasonIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function RivalryIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function PendingIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>; }
function TrainingIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>; }
function TrophyIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>; }
