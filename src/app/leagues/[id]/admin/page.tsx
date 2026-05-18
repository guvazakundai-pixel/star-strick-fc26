"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function LeagueAdminPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;
  const [league, setLeague] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("overview");

  const notify = (msg: string) => { setNotif(msg); setTimeout(() => setNotif(null), 3000); };

  useEffect(() => {
    if (!leagueId) return;
    fetch(`/api/leagues/${leagueId}`)
      .then(r => r.json())
      .then(d => { setLeague(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [leagueId]);

  const cmd = async (action: string, data: Record<string, any> = {}) => {
    try {
      const res = await fetch(`/api/leagues/${leagueId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed");
      notify("Done");
      return true;
    } catch (e: any) { notify(e.message); return false; }
  };

  if (loading) return <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>;
  if (!league) return <div className="broadcast-theme min-h-screen bc-grain flex items-center justify-center"><p className="text-muted-soft">League not found</p></div>;

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(600px 200px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }} />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
          <Link href={`/leagues/${leagueId}`} className="text-[10px] font-bold uppercase tracking-widest text-muted-soft hover:text-accent transition-colors">← Back to League</Link>
          <h1 className="cinematic-heading text-2xl sm:text-4xl text-ink mt-2">{league.name} <span className="text-gradient-pink text-xl">Admin</span></h1>
          <p className="text-sm text-muted-soft mt-1">League control panel — settings, players, matches, and operations.</p>
        </div>
      </div>

      <AnimatePresence>
        {notif && <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 bg-accent/90 text-black px-5 py-3 rounded-[14px] text-sm font-bold shadow-xl">{notif}</motion.div>}
      </AnimatePresence>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28">
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
          {["overview","settings","standings","players","matches","fixtures","actions"].map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeSection === s ? "bg-accent text-black" : "text-muted-soft hover:text-ink bg-white/3"
              }`}>{s}</button>
          ))}
        </div>

        {activeSection === "overview" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Status" value={league.status} />
            <StatCard label="Players" value={`${league._count?.participants ?? 0}/${league.maxPlayers}`} />
            <StatCard label="Type" value={league.type} />
            <StatCard label="Seasons" value={league.seasons?.length ?? 0} />
            <div className="col-span-full glass rounded-[24px] p-5 space-y-3">
              <h3 className="text-sm font-bold text-ink">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                {league.status === "LIVE" && <button onClick={() => cmd("pause")} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">Pause</button>}
                {league.status === "PAUSED" && <button onClick={() => cmd("resume")} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent/20 text-accent">Resume</button>}
                {(league.status === "LIVE" || league.status === "PAUSED") && <button onClick={() => {if(confirm("End current season?"))cmd("end-season");}} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-negative/20 text-negative">End Season</button>}
                {league.status === "COMPLETED" && <button onClick={() => cmd("start-season")} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent/20 text-accent">New Season</button>}
                <button onClick={() => {const u=prompt("User ID:");if(u)cmd("kick-player",{userId:u});}} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-negative/20 text-negative">Kick Player</button>
                <button onClick={() => {if(confirm("Freeze standings?"))cmd("freeze-standings");}} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400">Freeze</button>
                {league.status === "FROZEN" && <button onClick={() => cmd("unfreeze-standings")} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent/20 text-accent">Unfreeze</button>}
              </div>
            </div>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-3">League Settings</h3>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Name</label>
                <input id="sName" defaultValue={league.name} className="w-full mt-1 px-4 py-2.5 rounded-[12px] text-sm text-ink outline-none bg-white/5" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Description</label>
                <textarea id="sDesc" defaultValue={league.description || ""} className="w-full mt-1 px-4 py-2.5 rounded-[12px] text-sm text-ink outline-none bg-white/5 resize-none" rows={3} />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Max Players</label>
                <input id="sMax" type="number" defaultValue={league.maxPlayers} className="w-full mt-1 px-4 py-2.5 rounded-[12px] text-sm text-ink outline-none bg-white/5" />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Status</label>
                <select id="sStatus" defaultValue={league.status} className="w-full mt-1 px-4 py-2.5 rounded-[12px] text-sm text-ink outline-none bg-white/5">
                  <option value="REGISTRATION">Registration</option>
                  <option value="LIVE">Live</option>
                  <option value="PAUSED">Paused</option>
                  <option value="FROZEN">Frozen</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <button onClick={() => {
                const n = (document.getElementById("sName") as HTMLInputElement)?.value;
                const d = (document.getElementById("sDesc") as HTMLTextAreaElement)?.value;
                const m = parseInt((document.getElementById("sMax") as HTMLInputElement)?.value);
                const s = (document.getElementById("sStatus") as HTMLSelectElement)?.value;
                cmd("update-settings", { name: n, description: d, maxPlayers: m, status: s });
              }} className="px-5 py-2.5 rounded-[12px] text-[10px] font-bold uppercase bg-accent text-black">Save Settings</button>
            </div>
          </div>
        )}

        {activeSection === "standings" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-3">Standings Editor</h3>
            <p className="text-xs text-muted-soft mb-3">Manually adjust points for any player in the standings.</p>
            <div className="flex gap-2 flex-wrap">
              <input id="adjUser" placeholder="User ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-48" />
              <input id="adjPts" type="number" placeholder="Points (+/-)" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-24" />
              <button onClick={() => {
                const u = (document.getElementById("adjUser") as HTMLInputElement)?.value;
                const p = parseInt((document.getElementById("adjPts") as HTMLInputElement)?.value);
                if (u && p) cmd("adjust-points", { userId: u, amount: p });
              }} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent text-black">Adjust Points</button>
            </div>
          </div>
        )}

        {activeSection === "players" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-3">Players ({(league.participants || league._count?.participants || 0)})</h3>
            <div className="space-y-2">
              {(league.participants || []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-[12px] bg-white/3 text-sm">
                  <span className="text-ink font-medium">{p.user?.displayName || p.user?.username}</span>
                  <button onClick={() => {if(confirm(`Kick ${p.user?.username}?`))cmd("kick-player",{userId:p.userId});}} className="px-2 py-1 rounded-[8px] text-[9px] font-bold uppercase bg-negative/20 text-negative">Kick</button>
                </div>
              ))}
              {(league.participants || []).length === 0 && <p className="text-sm text-muted-soft">No players yet</p>}
            </div>
          </div>
        )}

        {activeSection === "matches" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-3">Match Control — Force Result</h3>
            <div className="flex gap-2 flex-wrap">
              <input id="fFixture" placeholder="Fixture ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-48" />
              <input id="fHome" placeholder="Home ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-36" />
              <input id="fAway" placeholder="Away ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-36" />
              <input id="fHS" type="number" placeholder="Home Score" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-20" />
              <input id="fAS" type="number" placeholder="Away Score" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-20" />
              <button onClick={() => {
                const fi = (document.getElementById("fFixture") as HTMLInputElement)?.value;
                const h = (document.getElementById("fHome") as HTMLInputElement)?.value;
                const a = (document.getElementById("fAway") as HTMLInputElement)?.value;
                const hs = parseInt((document.getElementById("fHS") as HTMLInputElement)?.value);
                const as = parseInt((document.getElementById("fAS") as HTMLInputElement)?.value);
                if (fi && h && a && !isNaN(hs) && !isNaN(as)) cmd("force-result", { fixtureId: fi, homeUserId: h, awayUserId: a, homeScore: hs, awayScore: as });
              }} className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent text-black">Force Result</button>
            </div>
            <div className="mt-4">
              <input id="vFixture" placeholder="Fixture ID" className="px-3 py-2 rounded-[10px] text-xs text-ink outline-none bg-white/5 w-48" />
              <button onClick={() => {const f=(document.getElementById("vFixture")as HTMLInputElement)?.value; if(f)cmd("void-match",{fixtureId:f});}} className="ml-2 px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-negative/20 text-negative">Void Match</button>
            </div>
          </div>
        )}

        {activeSection === "fixtures" && (
          <div className="glass rounded-[24px] p-5">
            <h3 className="text-sm font-bold text-ink mb-3">Fixture Management</h3>
            <p className="text-xs text-muted-soft mb-3">Clear pending fixtures to regenerate from the league page.</p>
            <button onClick={() => {if(confirm("Clear all pending fixtures?"))cmd("regenerate-fixtures");}}
              className="px-4 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400">Clear Pending Fixtures</button>
          </div>
        )}

        {activeSection === "actions" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Moderation</h3>
              <button onClick={() => {const u=prompt("User ID:"); cmd("promote-moderator",{userId:u});}}
                className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400">Promote to Admin</button>
            </div>
            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Season Control</h3>
              <button onClick={() => {const d=prompt("Deadline (ISO date):"); if(d)cmd("set-deadline",{deadline:d});}}
                className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-accent/20 text-accent">Set Match Deadline</button>
            </div>
            <div className="glass rounded-[24px] p-5">
              <h3 className="text-sm font-bold text-ink mb-2">Standings</h3>
              <button onClick={() => cmd("freeze-standings")}
                className="w-full px-3 py-2 rounded-[10px] text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400">Freeze Standings</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-[16px] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-1">{label}</p>
      <p className="text-xl font-bold text-ink truncate">{value}</p>
    </div>
  );
}
