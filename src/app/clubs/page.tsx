"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/session-client";
import { useAuthModal } from "@/lib/auth-context";

type ClubCard = {
  id: string;
  name: string;
  slug: string;
  tag: string;
  tagline: string;
  logoUrl: string | null;
  city: string;
  country: string;
  description: string;
  isVerified: boolean;
  membersInviteOnly: boolean;
  isPublic: boolean;
  joinCode: string;
  clubXp: number;
  winRate: number;
  memberCount: number;
  achievementCount: number;
  featuredLegends: string[];
  globalRank: {
    rankPosition: number;
    totalPoints: number;
    wins: number;
    losses: number;
    draws: number;
    played: number;
    goalsFor: number;
    goalsAgainst: number;
    momentum: number;
  } | null;
  manager: { username: string; displayName: string | null };
};

const REGIONS = [
  "Harare", "Bulawayo", "Mutare", "Gweru", "Chitungwiza",
  "Victoria Falls", "Masvingo", "Kwekwe", "Kadoma", "Marondera",
];

const RANK_STYLES: Record<number, { label: string; glow: string; gradient: string; border: string }> = {
  1: { label: "#1 GOLD", glow: "rgba(255,215,0,0.3)", gradient: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,184,0,0.04))", border: "rgba(255,215,0,0.2)" },
  2: { label: "#2 SILVER", glow: "rgba(192,192,192,0.3)", gradient: "linear-gradient(135deg, rgba(100,140,255,0.12), rgba(59,130,246,0.04))", border: "rgba(100,140,255,0.2)" },
  3: { label: "#3 BRONZE", glow: "rgba(205,127,50,0.3)", gradient: "linear-gradient(135deg, rgba(205,127,50,0.12), rgba(168,85,247,0.04))", border: "rgba(205,127,50,0.2)" },
};

const DEFAULT_GRADIENT = "linear-gradient(135deg, rgba(168,85,247,0.08), rgba(0,255,133,0.04))";
const DEFAULT_BORDER = "rgba(168,85,247,0.10)";

const CREATE_CLUB_SCHEMA = {
  name: "",
  tag: "",
  description: "",
  membersInviteOnly: false,
};

export default function ClubsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const { openAuth } = useAuthModal();

  const [clubs, setClubs] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [regionFilter, setRegionFilter] = useState(searchParams.get("region") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_CLUB_SCHEMA);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (regionFilter) params.set("region", regionFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/clubs?${params.toString()}`);
      const data = await res.json();
      setClubs(data.clubs ?? []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [searchQuery, regionFilter, statusFilter]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    const q = searchParams.get("q");
    const region = searchParams.get("region");
    const status = searchParams.get("status");
    if (q !== null) setSearchQuery(q);
    if (region !== null) setRegionFilter(region);
    if (status !== null) setStatusFilter(status);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (regionFilter) params.set("region", regionFilter);
    if (statusFilter) params.set("status", statusFilter);
    router.push(`/clubs?${params.toString()}`);
    fetchClubs();
  };

  const handleClear = () => {
    setSearchQuery("");
    setRegionFilter("");
    setStatusFilter("");
    router.push("/clubs");
  };

  const handleCreateClub = async () => {
    if (!session) {
      openAuth("signin");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/clubs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          tag: createForm.tag.toUpperCase(),
          description: createForm.description || undefined,
          membersInviteOnly: createForm.membersInviteOnly,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create club");
        return;
      }
      setShowCreateModal(false);
      setCreateForm(CREATE_CLUB_SCHEMA);
      fetchClubs();
      router.push(`/club/${data.club.slug}`);
    } catch {
      setCreateError("Something went wrong");
    } finally {
      setCreateLoading(false);
    }
  };

  const hasFilters = searchQuery || regionFilter || statusFilter;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(600px 250px at 50% 0%, rgba(168,85,247,0.06) 0%, transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-purple">Competition</p>
          <h1 className="cinematic-heading text-3xl sm:text-5xl md:text-6xl text-ink mt-1.5">
            ZIMFC <span className="text-gradient-pink">Clubs</span>
          </h1>
          <p className="mt-2 text-sm text-muted max-w-md">
            Represent a gaming hub. Compete for glory. Rise through the ranks.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-28">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-faint pointer-events-none">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs by name, tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-[14px] text-sm text-ink outline-none apple-input"
            />
          </div>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
            className="apple-input px-4 py-2.5 rounded-[14px] text-sm text-ink outline-none cursor-pointer min-w-[140px] appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%236B6D78' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "14px",
            }}
          >
            <option value="">All Regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="apple-input px-4 py-2.5 rounded-[14px] text-sm text-ink outline-none cursor-pointer min-w-[140px] appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%236B6D78' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              backgroundSize: "14px",
            }}
          >
            <option value="">All Clubs</option>
            <option value="open">Open Join</option>
            <option value="invite_only">Invite Only</option>
            <option value="verified">Verified</option>
          </select>
          <button type="submit"
            className="btn-primary px-6 py-2.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black"
            style={{ background: "var(--accent)", boxShadow: "0 2px 12px rgba(0,255,133,0.15)" }}
          >
            Search
          </button>
          {hasFilters && (
            <button type="button" onClick={handleClear}
              className="px-4 py-2.5 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-muted-soft border border-border hover:text-ink transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center justify-between mt-6 mb-4">
          <p className="text-[11px] font-mono text-muted-soft">
            {loading ? "Loading..." : `${clubs.length} club${clubs.length !== 1 ? "s" : ""} found`}
          </p>
          <button onClick={() => { if (!session) { openAuth("signin"); return; } setShowCreateModal(true); }}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-[12px] text-[10px] font-bold uppercase tracking-wider text-black transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: "var(--accent)", boxShadow: "0 2px 16px rgba(0,255,133,0.20)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            Create Club
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-[24px] p-5 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="h-5 w-28 rounded-md bg-white/5 mb-3" />
                <div className="h-3 w-40 rounded-md bg-white/3 mb-4" />
                <div className="h-3 w-20 rounded-md bg-white/3" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <div className="glass p-12 text-center space-y-4 rounded-[24px]">
            <p className="cinematic-heading text-3xl text-ink">No clubs found</p>
            <p className="text-sm text-muted">Try adjusting your search or filters, or create a new club.</p>
            <button onClick={() => { if (!session) { openAuth("signin"); return; } setShowCreateModal(true); }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-[14px] text-sm font-bold text-black transition-all duration-200 hover:scale-[1.03]"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M5 12h14" /><path d="M12 5v14" />
              </svg>
              Create Your Club
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const rank = club.globalRank?.rankPosition ?? 99;
              const style = RANK_STYLES[rank] || { label: `#${rank}`, glow: "rgba(168,85,247,0.15)", gradient: DEFAULT_GRADIENT, border: DEFAULT_BORDER };
              return (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <Link href={`/club/${club.slug}`}
                    className="block group relative overflow-hidden rounded-[24px] transition-all duration-400 hover:scale-[1.02]"
                    style={{
                      background: style.gradient,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${style.border}`,
                      boxShadow: `0 4px 24px ${style.glow}`,
                    }}
                  >
                    <div aria-hidden className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-[0.04] transition-all duration-500 group-hover:opacity-[0.10] group-hover:scale-110"
                      style={{ background: "radial-gradient(circle, currentColor, transparent 70%)", color: rank === 1 ? "gold" : rank === 2 ? "#648cff" : "var(--accent)" }}
                    />
                    <div className="relative z-10 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-ink font-bold text-lg group-hover:text-accent transition-colors duration-300 truncate">{club.name}</p>
                            {club.isVerified && <span className="pill-accent text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">✓</span>}
                          </div>
                          <p className="text-xs text-muted-soft mt-0.5 font-mono">[{club.tag}] · {club.city}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums"
                            style={{
                              background: rank <= 3 ? "rgba(255,215,0,0.12)" : "rgba(168,85,247,0.10)",
                              color: rank <= 3 ? "#ffd700" : "var(--accent)",
                              border: `1px solid ${rank <= 3 ? "rgba(255,215,0,0.2)" : "rgba(168,85,247,0.15)"}`,
                              boxShadow: rank <= 3 ? `0 2px 12px ${style.glow}` : "none",
                            }}
                          >{style.label}</span>
                        </div>
                      </div>
                      {club.tagline && <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">{club.tagline}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-faint">
                        <span className="flex items-center gap-1"><UsersIcon />{club.memberCount}</span>
                        <span className="flex items-center gap-1"><XPIcon />{club.clubXp.toLocaleString()} XP</span>
                        {club.winRate > 0 && <span className="flex items-center gap-1" style={club.winRate >= 60 ? { color: "var(--accent)" } : undefined}><TrophyIcon />{club.winRate}% WR</span>}
                        {club.achievementCount > 0 && <span className="flex items-center gap-1">{club.achievementCount}</span>}
                      </div>
                      {club.featuredLegends.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-gold/70">Legends:</span>
                          <div className="flex flex-wrap gap-1">
                            {club.featuredLegends.slice(0, 3).map((legend) => (
                              <span key={legend} className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                                style={{ background: "rgba(255,215,0,0.08)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.10)" }}
                              >{legend}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between text-xs">
                        <span className="text-muted-faint">{club.globalRank ? `${club.globalRank.wins}W · ${club.globalRank.losses}L · ${club.globalRank.draws}D` : "No data"}</span>
                        <span className="text-muted-soft group-hover:text-accent transition-colors duration-300 flex items-center gap-1">
                          View Club
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="relative w-full max-w-sm rounded-[24px] p-6"
              style={{ background: "rgba(14,16,20,0.96)", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-ink">Create Club</h3>
              <p className="text-sm text-muted mt-1">Start your own gaming hub</p>
              {createError && <p className="text-xs text-negative mt-3 bg-negative/10 rounded-xl px-3 py-2">{createError}</p>}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Club Name</label>
                  <input type="text" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Harare Thunder"
                    className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Tag (2-5 uppercase letters)</label>
                  <input type="text" value={createForm.tag} onChange={(e) => setCreateForm({ ...createForm, tag: e.target.value.toUpperCase() })} placeholder="e.g. HAR"
                    className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none uppercase"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-soft">Description (optional)</label>
                  <textarea value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} placeholder="What makes your club special?"
                    className="w-full mt-1.5 px-4 py-3 rounded-[14px] text-sm text-ink outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    rows={3} maxLength={500}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={createForm.membersInviteOnly} onChange={(e) => setCreateForm({ ...createForm, membersInviteOnly: e.target.checked })}
                    className="h-4 w-4 rounded accent-accent"
                  />
                  <span className="text-xs text-muted-soft">Invite-only membership</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-[14px] text-sm text-muted-soft"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >Cancel</button>
                <button onClick={handleCreateClub} disabled={createLoading || !createForm.name || !createForm.tag}
                  className="flex-1 py-3 rounded-[14px] text-sm font-bold text-black disabled:opacity-50"
                  style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(0,255,133,0.25)" }}
                >{createLoading ? "Creating..." : "Create Club"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function XPIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
