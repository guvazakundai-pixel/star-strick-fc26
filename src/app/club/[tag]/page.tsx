"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "@/lib/session-client";

type ClubDetail = Record<string, unknown>;
type Member = Record<string, unknown>;

export default function ClubProfilePage() {
  const params = useParams();
  const tag = params.tag as string;
  const session = useSession();
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myMembership, setMyMembership] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!tag) return;
    const load = async () => {
      try {
        const clubsRes = await fetch(`/api/clubs?q=${encodeURIComponent(tag)}&limit=50`);
        const clubsData = await clubsRes.json();
        const found = (clubsData.clubs ?? []).find((c: any) => c.slug === tag || c.tag === tag.toUpperCase());
        if (!found) { setLoading(false); return; }

        const detailRes = await fetch(`/api/clubs/${found.id}`);
        const detail = await detailRes.json();

        setClub({ ...detail.club, ...found });
        setMembers(detail.members ?? []);

        if (session?.userId) {
          const manageRes = await fetch(`/api/club/manage?clubId=${found.id}`);
          const manageData = await manageRes.json();
          const myM = (manageData.members ?? []).find((m: any) => m.user_id === session.userId);
          setMyMembership(myM ?? null);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [tag, session?.userId]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch("/api/club/recruitment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", data: { clubId: club?.id, message: applyMsg } }),
      });
      if (res.ok) setShowApplyModal(false);
    } finally { setApplying(false); }
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
        <Link href="/clubs" className="btn-primary mt-4 inline-flex px-4 py-2 rounded-[12px] text-xs font-bold text-black">Browse Clubs</Link>
      </div>
    </div>
  );

  const roleOrder = ["OWNER", "CO_OWNER", "GM", "COACH", "CAPTAIN", "ASST_CAPTAIN", "SCOUT", "MODERATOR", "PRO_PLAYER", "ACADEMY", "TRIAL", "CONTENT_CREATOR"];
  const sorted = [...(members as any[])].sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative">
        <div className="h-40 sm:h-56 bg-gradient-to-br from-purple/20 via-transparent to-accent/10" style={{ background: club.banner_url ? `url(${club.bannerUrl}) center/cover` : undefined }} />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt="" className="w-20 h-20 sm:w-28 sm:h-28 rounded-[20px] border-2 border-border shadow-xl" style={{ background: "var(--surface)" }} />
            ) : (
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[20px] border-2 border-border shadow-xl flex items-center justify-center text-3xl font-bold text-muted-soft" style={{ background: "var(--surface)" }}>
                {club.tag?.[0] || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2">
                <h1 className="cinematic-heading text-2xl sm:text-4xl text-ink truncate">{club.name}</h1>
                {club.isVerified && <span className="pill-accent text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">✓ Verified</span>}
              </div>
              <p className="text-sm text-muted-soft font-mono">[{club.tag}] · {club.city}{club.country ? `, ${club.country}` : ""}</p>
              <p className="text-xs text-muted-faint mt-1">Founded {club.createdAt?.slice(0, 10) || club.created_at?.slice(0, 10) || "Unknown"}</p>
            </div>
            <div className="flex gap-2 pb-2">
              {myMembership ? (
                ["OWNER", "CO_OWNER", "GM", "CAPTAIN"].includes(myMembership.role) && (
                  <Link href={`/club/${tag}/manage`} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black transition-all hover:scale-[1.03]"
                    style={{ background: "var(--accent)", boxShadow: "0 2px 16px rgba(0,255,133,0.20)" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                    Manage
                  </Link>
                )
              ) : (
                <button onClick={() => setShowApplyModal(true)} className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black transition-all hover:scale-[1.03]"
                  style={{ background: "var(--accent)", boxShadow: "0 2px 16px rgba(0,255,133,0.20)" }}
                >Apply to Join</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28 mt-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass rounded-[24px] p-5">
              <h2 className="text-sm font-bold text-ink mb-2">About</h2>
              <p className="text-sm text-muted leading-relaxed">{club.description || club.tagline || "No description yet."}</p>
            </div>

            <div className="glass rounded-[24px] p-5">
              <h2 className="text-sm font-bold text-ink mb-3">Roster ({sorted.length})</h2>
              <div className="space-y-1.5">
                {sorted.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-[14px] transition-colors hover:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-muted-soft overflow-hidden">
                        {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" /> : (m.username?.[0] || "?").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-ink font-bold">{m.displayName || m.username}</p>
                        <p className="text-[10px] text-muted-soft font-mono uppercase">{m.role.replace("_", " ")}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-soft">
                      {m._count?.stats && <span>{m._count.stats} matches</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-[24px] p-5 space-y-3">
              <h2 className="text-sm font-bold text-ink">Club Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-[12px] bg-white/3 text-center">
                  <p className="text-lg font-bold text-ink">{members.length}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-soft">Members</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white/3 text-center">
                  <p className="text-lg font-bold text-ink">{club.clubXp || 0}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-soft">XP</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white/3 text-center">
                  <p className="text-lg font-bold text-ink">{club.winRate || 0}%</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-soft">Win Rate</p>
                </div>
                <div className="p-3 rounded-[12px] bg-white/3 text-center">
                  <p className="text-lg font-bold text-ink">{club.achievementCount || 0}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-soft">Trophies</p>
                </div>
              </div>
              {club.globalRank && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-soft">Global Rank</p>
                  <p className="text-xl font-bold text-ink">#{club.globalRank.rankPosition}</p>
                  <p className="text-xs text-muted-soft">{club.globalRank.wins}W · {club.globalRank.draws}D · {club.globalRank.losses}L</p>
                </div>
              )}
            </div>

            {club.manager && (
              <div className="glass rounded-[24px] p-5">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-2">Manager</h2>
                <p className="text-sm text-ink font-bold">{club.manager.displayName || club.manager.username}</p>
              </div>
            )}

            <div className="glass rounded-[24px] p-5">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-muted-soft mb-2">Quick Links</h2>
              <div className="flex flex-wrap gap-2">
                {myMembership && ["OWNER", "CO_OWNER", "GM", "CAPTAIN"].includes(myMembership.role) && (
                  <Link href={`/club/${tag}/manage`} className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">Manage Club</Link>
                )}
                <Link href="/clubs" className="px-3 py-1.5 rounded-[10px] text-[10px] font-bold uppercase tracking-wider bg-white/5 text-ink hover:bg-white/10 transition-colors">All Clubs</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowApplyModal(false)}>
          <div className="w-full max-w-sm rounded-[24px] p-6" style={{ background: "rgba(14,16,20,0.96)", border: "1px solid rgba(255,255,255,0.06)" }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-ink">Apply to {club.name}</h3>
            <textarea value={applyMsg} onChange={(e) => setApplyMsg(e.target.value)} placeholder="Tell them why you want to join..."
              className="w-full mt-3 px-4 py-3 rounded-[14px] text-sm text-ink outline-none resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }} rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowApplyModal(false)} className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft" style={{ background: "rgba(255,255,255,0.04)" }}>Cancel</button>
              <button onClick={handleApply} disabled={applying} className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >{applying ? "Sending..." : "Send Application"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
