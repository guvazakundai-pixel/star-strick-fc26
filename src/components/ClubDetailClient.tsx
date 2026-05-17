"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedTabs, TabContent, type Tab } from "@/components/ui/AnimatedTabs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ClubChat } from "@/components/ClubChat";
import { JoinRequestsManager } from "@/components/JoinRequestsManager";

type GlobalRank = {
  rankPosition: number;
  prevPosition: number | null;
  totalPoints: number;
  wins: number;
  losses: number;
  draws: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  momentum: number;
};

type ClubDetail = {
  id: string;
  name: string;
  slug: string;
  tag: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string;
  country: string;
  isVerified: boolean;
  membersInviteOnly: boolean;
  isPublic: boolean;
  joinCode: string;
  clubXp: number;
  winRate: number;
  momentum: number;
  featuredLegends: string[];
  trophies: string[];
  createdAt: string;
  manager: { id: string; username: string; displayName: string; avatarUrl: string | null };
  globalRank: GlobalRank | null;
  memberCount: number;
  achievementCount: number;
  activityCount: number;
};

type MemberDetail = {
  id: string;
  role: string;
  title: string | null;
  clubXp: number;
  status: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    country: string;
    stats: { points: number; wins: number; losses: number; draws: number; skillRating: number; winStreak: number } | null;
    playerRanking: { rankPosition: number } | null;
  };
};

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; username: string; displayName: string | null; avatarUrl: string | null };
};

type LeagueBrief = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  participantCount: number;
  maxPlayers: number;
};

type TournamentBrief = {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  participantCount: number;
  maxPlayers: number;
};

type AchievementItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  earnedAt: string;
};

type RivalDetail = {
  clubId: string;
  name: string;
  slug: string;
  tag: string;
  logoUrl: string | null;
  clubXp: number;
  rank: number;
  ourWins: number;
  theirWins: number;
  draws: number;
};

type MatchBrief = {
  id: string;
  score1: number;
  score2: number;
  player1: { id: string; username: string; displayName: string | null };
  player2: { id: string; username: string; displayName: string | null };
  winner: { id: string; username: string; displayName: string | null } | null;
  createdAt: string;
};

export interface ClubDetailClientProps {
  club: ClubDetail;
  members: MemberDetail[];
  isMember: boolean;
  isManager: boolean;
  currentUserId?: string;
  onJoin?: () => void;
  onLeave?: () => void;
  onInvite?: () => void;
  activities: ActivityItem[];
  leagues: LeagueBrief[];
  tournaments: TournamentBrief[];
  achievements: AchievementItem[];
  rivals: RivalDetail[];
  recentMatches: MatchBrief[];
  className?: string;
}

const ROLE_STYLES: Record<string, string> = {
  OWNER: "text-gold border-gold/20 bg-gold/10",
  MANAGER: "text-accent border-accent/16 bg-accent/8",
  CAPTAIN: "text-purple border-purple/20 bg-purple/10",
  LEGEND: "text-gold border-gold/20 bg-gold/8",
  PRO: "text-cyan border-cyan/20 bg-cyan/10",
  MEMBER: "text-muted-faint border-white/5 bg-white/[0.03]",
  RECRUIT: "text-muted-faint/60 border-white/3 bg-white/[0.02]",
};

const ACTIVITY_ICONS: Record<string, string> = {
  MATCH_RESULT: "⚔️",
  NEW_SIGNING: "📝",
  TOURNAMENT_WIN: "🏆",
  RIVALRY_UPDATE: "🔥",
  ANNOUNCEMENT: "📢",
  MVP_HIGHLIGHT: "⭐",
  ACHIEVEMENT: "🎖️",
  MEMBER_JOINED: "👋",
  CLUB_CREATED: "✨",
};

function timeAgo(date: string): string {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return `${Math.floor(day / 30)}mo ago`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === "APPROVED" || status === "ACTIVE" || status === "ONLINE"
      ? "var(--accent)"
      : status === "AWAY" || status === "IDLE"
        ? "var(--gold)"
        : "var(--muted-faint)";
  return (
    <span
      className="relative inline-flex h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
    >
      {(status === "ACTIVE" || status === "ONLINE") && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: color }}
        />
      )}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="frosted-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border-faint">
        <h2 className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
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

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function ClubDetailClient({
  club,
  members,
  isMember,
  isManager,
  currentUserId,
  onJoin,
  onLeave,
  onInvite,
  activities,
  leagues,
  tournaments,
  achievements,
  rivals,
  recentMatches,
  className = "",
}: ClubDetailClientProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [activityPage, setActivityPage] = useState(1);
  const [rosterSearch, setRosterSearch] = useState("");

  const ACTIVITY_PER_PAGE = 10;
  const displayedActivity = activities.slice(0, activityPage * ACTIVITY_PER_PAGE);
  const hasMoreActivity = displayedActivity.length < activities.length;

  const filteredMembers = useMemo(() => {
    if (!rosterSearch) return members;
    const q = rosterSearch.toLowerCase();
    return members.filter(
      (m) =>
        (m.user.displayName || m.user.username).toLowerCase().includes(q) ||
        m.user.username.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, rosterSearch]);

  const memoizedTabs = useMemo<Tab[]>(
    () => [
      { id: "overview", label: "Overview", icon: <ShieldIcon />, badge: achievements.length },
      { id: "roster", label: "Roster", icon: <UsersIcon />, badge: members.length },
      ...(leagues.length > 0 ? [{ id: "leagues", label: "Club Leagues", badge: leagues.length } as Tab] : []),
      ...(tournaments.length > 0 ? [{ id: "tournaments", label: "Club Tournaments", badge: tournaments.length } as Tab] : []),
      { id: "activity", label: "Activity Feed", badge: activities.length > 5 ? activities.length : undefined },
      ...(isMember ? [{ id: "chat", label: "Chat" } as Tab] : []),
    ],
    [achievements.length, members.length, leagues.length, tournaments.length, activities.length, isMember],
  );

  const clubLevel = Math.floor(club.clubXp / 1000) + 1;
  const xpInLevel = club.clubXp % 1000;
  const xpForNext = 1000;
  const xpPercent = Math.min((xpInLevel / xpForNext) * 100, 100);

  const rankStyle = (() => {
    const r = club.globalRank?.rankPosition;
    if (r === 1) return { color: "#ffd700", glow: "rgba(255,215,0,0.25)" };
    if (r === 2) return { color: "#648cff", glow: "rgba(100,140,255,0.25)" };
    if (r === 3) return { color: "#cd7f32", glow: "rgba(205,127,50,0.25)" };
    return { color: "var(--accent)", glow: "rgba(0,255,133,0.15)" };
  })();

  const statCards = [
    {
      label: "Rank",
      value: club.globalRank ? `#${club.globalRank.rankPosition}` : "—",
      sub: club.globalRank?.prevPosition ? `from #${club.globalRank.prevPosition}` : undefined,
      accent: club.globalRank ? club.globalRank.rankPosition <= 3 : false,
      style: rankStyle,
    },
    {
      label: "Club XP",
      value: club.clubXp.toLocaleString(),
      sub: `Level ${clubLevel}`,
    },
    {
      label: "Win Rate",
      value: `${club.winRate}%`,
      accent: club.winRate >= 60,
      sub: club.globalRank ? `${club.globalRank.wins}W / ${club.globalRank.losses}L` : undefined,
    },
    {
      label: "Members",
      value: club.memberCount,
      sub: "active",
    },
  ];

  return (
    <div className={`${className}`}>
      <ClubBanner club={club} />

      <div className="mx-auto max-w-4xl px-4 -mt-16 relative z-20">
        <ClubHeader
          club={club}
          isMember={isMember}
          isManager={isManager}
          onJoin={onJoin}
          onLeave={onLeave}
          onInvite={onInvite}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5"
        >
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="frosted-card-sm p-4 rounded-[20px]"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{card.label}</p>
              <p
                className="cinematic-heading text-2xl sm:text-3xl mt-1 tabular-nums"
                style={card.accent && card.style ? { color: card.style.color } : card.accent ? { color: "var(--accent)" } : undefined}
              >
                {typeof card.value === "number" ? <AnimatedCounter value={card.value} /> : card.value}
              </p>
              {card.sub && <p className="text-[10px] text-muted-faint mt-0.5 font-mono">{card.sub}</p>}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-soft">
              <XPIcon />
              <span>Level {clubLevel} · Club XP</span>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-muted-soft">
              {xpInLevel.toLocaleString()} / {xpForNext.toLocaleString()}
            </span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
              className="h-full rounded-full relative"
              style={{
                background: "linear-gradient(90deg, var(--accent), #22d3ee)",
                boxShadow: "0 0 12px rgba(0,255,133,0.30)",
              }}
            />
          </div>
        </motion.div>

        <div className="mt-6">
          <AnimatedTabs
            tabs={memoizedTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            sticky
          />
        </div>

        <div className="mt-5 pb-28">
          <TabContent id="overview" activeTab={activeTab}>
            <OverviewTab
              club={club}
              achievements={achievements}
              rivals={rivals}
              recentMatches={recentMatches}
              activities={activities}
              memberCount={members.length}
            />
            <div className="mt-4">
              <JoinRequestsManager clubId={club.id} isManager={isManager} isMember={isMember} onJoin={onJoin} />
            </div>
          </TabContent>

          <TabContent id="roster" activeTab={activeTab}>
            <RosterTab
              members={filteredMembers}
              total={members.length}
              search={rosterSearch}
              onSearchChange={setRosterSearch}
              isManager={isManager}
              onInvite={onInvite}
            />
          </TabContent>

          <TabContent id="leagues" activeTab={activeTab}>
            <ClubLeaguesTab leagues={leagues} />
          </TabContent>

          <TabContent id="tournaments" activeTab={activeTab}>
            <ClubTournamentsTab tournaments={tournaments} />
          </TabContent>

          <TabContent id="activity" activeTab={activeTab}>
            <ActivityFeedTab
              activities={displayedActivity}
              hasMore={hasMoreActivity}
              onLoadMore={() => setActivityPage((p) => p + 1)}
            />
          </TabContent>

          <TabContent id="chat" activeTab={activeTab}>
            <div className="frosted-card p-4 rounded-[24px]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.24em] text-accent mb-4">Club Chat</h2>
              {currentUserId && <ClubChat clubId={club.id} currentUserId={currentUserId} />}
            </div>
          </TabContent>
        </div>
      </div>
    </div>
  );
}

function ClubBanner({ club }: { club: ClubDetail }) {
  return (
    <div className="relative overflow-hidden" style={{ height: "260px" }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: club.bannerUrl
            ? `url(${club.bannerUrl})`
            : "linear-gradient(135deg, #0D0D0F, #1a1040 40%, #0a1628 70%, #0D0D0F)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/40 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: "linear-gradient(to top, rgba(13,13,15,0.6) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

function ClubHeader({
  club,
  isMember,
  isManager,
  onJoin,
  onLeave,
  onInvite,
}: {
  club: ClubDetail;
  isMember: boolean;
  isManager: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
  onInvite?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-end gap-4 flex-wrap sm:flex-nowrap">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
          className="h-20 w-20 sm:h-24 sm:w-24 rounded-[20px] border-2 border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0"
          style={{
            background: club.logoUrl
              ? `url(${club.logoUrl}) center/cover`
              : "linear-gradient(135deg, rgba(22,24,28,0.95), rgba(18,20,24,0.85))",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {!club.logoUrl && (
            <span className="cinematic-heading text-3xl sm:text-4xl text-accent">
              {club.tag?.[0] ?? club.name[0]}
            </span>
          )}
        </motion.div>

        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="cinematic-heading text-2xl sm:text-3xl text-ink">{club.name}</h1>
            {club.isVerified && (
              <span className="pill-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                ✓
              </span>
            )}
            {club.globalRank && club.globalRank.rankPosition <= 3 && (
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,215,0,0.10)",
                  color: "#ffd700",
                  border: "1px solid rgba(255,215,0,0.15)",
                }}
              >
                #{club.globalRank.rankPosition}
              </span>
            )}
          </div>
          <p className="font-mono text-[11px] text-muted-soft mt-0.5">
            [{club.tag}] · {club.city}, {club.country}
          </p>
          {club.tagline && (
            <p className="text-xs text-muted mt-1 max-w-lg italic">&ldquo;{club.tagline}&rdquo;</p>
          )}
          <p className="text-[10px] text-muted-faint mt-1 font-mono">
            Manager: {club.manager.displayName || club.manager.username}
          </p>
        </div>

        <div className="shrink-0 pb-1 flex gap-2">
          {!isMember ? (
            <button
              onClick={onJoin}
              className="btn-primary px-5 py-2.5 rounded-[14px] text-sm font-bold text-black transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
              style={{
                background: "var(--accent)",
                boxShadow: "0 4px 20px rgba(0,255,133,0.25)",
              }}
            >
              Join Club
            </button>
          ) : (
            <>
              {isManager && onInvite && (
                <button
                  onClick={onInvite}
                  className="btn-ghost px-4 py-2.5 rounded-[14px] text-sm font-bold text-accent border border-accent/20 hover:bg-accent/10 transition-all duration-200"
                >
                  Invite
                </button>
              )}
              <button
                onClick={onLeave}
                className="px-4 py-2.5 rounded-[14px] text-sm font-bold transition-all duration-200"
                style={{
                  background: "rgba(255,77,77,0.08)",
                  color: "var(--negative)",
                  border: "1px solid rgba(255,77,77,0.12)",
                }}
              >
                Leave
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function OverviewTab({
  club,
  achievements,
  rivals,
  recentMatches,
  activities,
  memberCount,
}: {
  club: ClubDetail;
  achievements: AchievementItem[];
  rivals: RivalDetail[];
  recentMatches: MatchBrief[];
  activities: ActivityItem[];
  memberCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {club.description && (
        <Section title="About">
          <p className="text-sm text-muted leading-relaxed">{club.description}</p>
          <div className="flex items-center gap-3 mt-4 text-xs text-muted-soft">
            <span className="flex items-center gap-1.5">
              <UsersIcon />
              <span className="font-bold text-ink tabular-nums"><AnimatedCounter value={memberCount} /></span> members
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldIcon />
              <span className="font-bold text-ink">Level {Math.floor(club.clubXp / 1000) + 1}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <TrophyIcon />
              <span className="font-bold text-ink tabular-nums">{club.achievementCount}</span> achievements
            </span>
          </div>
          {club.featuredLegends.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold/70">Featured Legends:</span>
              {club.featuredLegends.map((legend) => (
                <span
                  key={legend}
                  className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: "rgba(255,215,0,0.08)",
                    color: "#ffd700",
                    border: "1px solid rgba(255,215,0,0.10)",
                  }}
                >
                  {legend}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {club.globalRank && club.globalRank.played > 0 && (
        <Section title="Competitive Record">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <RecordStat label="Matches" value={club.globalRank.played} />
            <RecordStat label="Wins" value={club.globalRank.wins} accent />
            <RecordStat label="Draws" value={club.globalRank.draws} />
            <RecordStat label="Losses" value={club.globalRank.losses} negative />
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs font-mono text-muted-soft">
            <span>
              Goals: <strong className="text-ink">{club.globalRank.goalsFor}</strong> :{" "}
              <strong className="text-ink">{club.globalRank.goalsAgainst}</strong>
            </span>
            <span>
              GD:{" "}
              <strong
                className={
                  club.globalRank.goalsFor - club.globalRank.goalsAgainst >= 0
                    ? "text-accent"
                    : "text-negative"
                }
              >
                {club.globalRank.goalsFor - club.globalRank.goalsAgainst >= 0
                  ? `+${club.globalRank.goalsFor - club.globalRank.goalsAgainst}`
                  : club.globalRank.goalsFor - club.globalRank.goalsAgainst}
              </strong>
            </span>
            <span>
              Momentum:{" "}
              <strong className="text-ink">{club.globalRank.momentum}%</strong>
            </span>
          </div>
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Trophy Cabinet">
          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3.5 rounded-[16px] hover:bg-white/[0.02] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.03)" }}
              >
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-muted mt-0.5">{a.description}</p>
                  )}
                  <p className="text-[10px] text-muted-faint font-mono mt-1">{timeAgo(a.earnedAt)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {recentMatches.length > 0 && (
        <Section title="Recent Matches">
          <div className="space-y-1.5">
            {recentMatches.map((m) => {
              const p1Name = m.player1.displayName || m.player1.username;
              const p2Name = m.player2.displayName || m.player2.username;
              const isP1Win = m.winner?.id === m.player1.id;
              return (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="flex items-center justify-between px-4 py-3 rounded-[16px] hover:bg-white/[0.02] transition-colors"
                  style={{ border: "1px solid rgba(255,255,255,0.03)" }}
                >
                  <span
                    className={`text-xs font-medium truncate max-w-[30%] ${isP1Win ? "text-accent" : "text-ink"}`}
                  >
                    {p1Name}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
                    <span className={isP1Win ? "text-accent" : "text-ink"}>{m.score1}</span>
                    <span className="text-muted-faint">:</span>
                    <span className={!isP1Win && m.winner ? "text-accent" : "text-ink"}>
                      {m.score2}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium truncate max-w-[30%] text-right ${!isP1Win && m.winner ? "text-accent" : "text-ink"}`}
                  >
                    {p2Name}
                  </span>
                </Link>
              );
            })}
          </div>
        </Section>
      )}

      {rivals.length > 0 && (
        <Section title="Rivalries">
          <div className="space-y-2">
            {rivals.map((rival) => (
              <Link
                key={rival.clubId}
                href={`/club/${rival.slug}`}
                className="flex items-center justify-between p-4 rounded-[18px] transition-all duration-200 hover:bg-white/[0.02]"
                style={{
                  border: "1px solid rgba(255,50,50,0.06)",
                  background: "linear-gradient(135deg, rgba(255,50,50,0.03), rgba(168,85,247,0.03))",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-[12px] flex items-center justify-center text-sm font-bold"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {rival.tag?.[0] ?? rival.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">{rival.name}</p>
                    <p className="font-mono text-[10px] text-muted-faint">
                      #{rival.rank} · {rival.clubXp.toLocaleString()} XP
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm font-mono tabular-nums">
                    <span className="text-accent font-bold">{rival.ourWins}</span>
                    <span className="text-muted-faint">-</span>
                    <span className="text-negative font-bold">{rival.theirWins}</span>
                  </div>
                  <p className="text-[10px] text-muted-faint">{rival.draws} draws</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {activities.length > 0 && (
        <Section title="Recent Activity">
          <div className="space-y-2">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-[14px]"
                style={{ border: "1px solid rgba(255,255,255,0.03)" }}
              >
                <div
                  className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <span className="text-sm">{ACTIVITY_ICONS[act.type] || "📌"}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-ink">{act.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-faint">
                      {act.user.displayName || act.user.username}
                    </span>
                    <span className="text-muted-faint">·</span>
                    <span className="text-xs text-muted-faint font-mono">{timeAgo(act.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </motion.div>
  );
}

function RecordStat({
  label,
  value,
  accent,
  negative,
}: {
  label: string;
  value: number;
  accent?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="text-center p-3 rounded-[14px]" style={{ border: "1px solid rgba(255,255,255,0.03)" }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p
        className={`cinematic-heading text-2xl mt-0.5 tabular-nums ${
          accent ? "text-accent" : negative ? "text-negative" : "text-ink"
        }`}
      >
        <AnimatedCounter value={value} />
      </p>
    </div>
  );
}

function RosterTab({
  members,
  total,
  search,
  onSearchChange,
  isManager,
  onInvite,
}: {
  members: MemberDetail[];
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
  isManager: boolean;
  onInvite?: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-faint pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2.5 rounded-[14px] text-xs text-ink outline-none apple-input"
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft shrink-0">
          {members.length} / {total} members
        </p>
        {isManager && onInvite && (
          <button
            onClick={onInvite}
            className="shrink-0 px-4 py-2 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-black transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: "var(--accent)",
              boxShadow: "0 2px 12px rgba(0,255,133,0.20)",
            }}
          >
            Invite
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted">
            {total === 0 ? "No members yet" : "No members match your search"}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025 }}
            >
              <Link
                href={`/player/${m.user.username}`}
                className="flex items-center gap-3.5 p-3.5 rounded-[18px] transition-all duration-200 hover:bg-white/[0.02]"
                style={{ border: "1px solid rgba(255,255,255,0.03)" }}
              >
                <span className="font-mono text-xs text-muted-faint w-6 text-right tabular-nums shrink-0">
                  #{i + 1}
                </span>
                <div
                  className="h-10 w-10 rounded-[12px] flex items-center justify-center text-sm font-bold overflow-hidden shrink-0"
                  style={{
                    background: m.user.avatarUrl
                      ? `url(${m.user.avatarUrl}) center/cover`
                      : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {!m.user.avatarUrl && (
                    <span className="text-accent">
                      {(m.user.displayName || m.user.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-ink truncate">
                      {m.user.displayName || m.user.username}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        ROLE_STYLES[m.role] || ROLE_STYLES.MEMBER
                      }`}
                    >
                      {m.role}
                    </span>
                    {m.title && (
                      <span className="text-[9px] text-muted-faint italic">&ldquo;{m.title}&rdquo;</span>
                    )}
                    <StatusDot status={m.status} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-faint mt-0.5">
                    <span>{m.clubXp.toLocaleString()} XP</span>
                    {m.user.stats && (
                      <span>
                        {m.user.stats.wins}W · {m.user.stats.losses}L
                      </span>
                    )}
                    {m.user.playerRanking && (
                      <span>#{m.user.playerRanking.rankPosition} Global</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-lg font-bold tabular-nums text-ink">
                    {m.clubXp.toLocaleString()}
                  </p>
                  <p className="text-[8px] text-muted-faint">XP</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function ClubLeaguesTab({ leagues }: { leagues: LeagueBrief[] }) {
  if (leagues.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-3xl mb-3">🏟️</p>
        <p className="text-sm text-muted">No active league participations</p>
        <Link
          href="/leagues"
          className="inline-block mt-4 text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
        >
          Browse Leagues
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {leagues.map((l) => {
        const statusColor =
          l.status === "LIVE"
            ? "text-accent"
            : l.status === "REGISTRATION"
              ? "text-gold"
              : l.status === "COMPLETED"
                ? "text-muted-soft"
                : "text-muted-faint";
        return (
          <Link
            key={l.id}
            href={`/leagues/${l.id}`}
            className="frosted-card-sm flex items-center justify-between p-4 rounded-[18px] transition-all duration-200 hover:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink truncate">{l.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-black tracking-wider uppercase ${statusColor}`}>
                  {l.status}
                </span>
                <span className="text-[9px] font-bold text-muted-faint uppercase">{l.type}</span>
              </div>
            </div>
            <div className="shrink-0 text-right ml-4">
              <p className="font-mono text-sm tabular-nums text-ink">
                {l.participantCount}/{l.maxPlayers}
              </p>
              <p className="text-[8px] text-muted-faint">Players</p>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

function ClubTournamentsTab({ tournaments }: { tournaments: TournamentBrief[] }) {
  if (tournaments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-3xl mb-3">🏆</p>
        <p className="text-sm text-muted">No active tournaments enrolled</p>
        <Link
          href="/tournaments"
          className="inline-block mt-4 text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
        >
          Browse Tournaments
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {tournaments.map((t) => {
        const statusColor =
          t.status === "LIVE"
            ? "text-accent"
            : t.status === "REGISTRATION"
              ? "text-gold"
              : t.status === "COMPLETED"
                ? "text-muted-soft"
                : "text-muted-faint";
        return (
          <Link
            key={t.id}
            href={`/tournaments/${t.id}`}
            className="frosted-card-sm flex items-center justify-between p-4 rounded-[18px] transition-all duration-200 hover:bg-white/[0.02]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink truncate">{t.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[9px] font-black tracking-wider uppercase ${statusColor}`}>
                  {t.status}
                </span>
                <span className="text-[9px] font-bold text-muted-faint uppercase">
                  {t.type === "KNOCKOUT" ? "Single Elim" : "Round Robin"}
                </span>
              </div>
            </div>
            <div className="shrink-0 text-right ml-4">
              <p className="font-mono text-sm tabular-nums text-ink">
                {t.participantCount}/{t.maxPlayers}
              </p>
              <p className="text-[8px] text-muted-faint">Players</p>
            </div>
          </Link>
        );
      })}
    </motion.div>
  );
}

function ActivityFeedTab({
  activities,
  hasMore,
  onLoadMore,
}: {
  activities: ActivityItem[];
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  if (activities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-3xl mb-3">📭</p>
        <p className="text-sm text-muted">No activity yet</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-2">
        {activities.map((act, i) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.3 }}
            className="flex items-start gap-3.5 p-4 rounded-[18px] hover:bg-white/[0.02] transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.03)" }}
          >
            <div
              className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-base">{ACTIVITY_ICONS[act.type] || "📌"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink">{act.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-faint">
                  {act.user.displayName || act.user.username}
                </span>
                <span className="text-muted-faint">·</span>
                <span className="text-xs text-muted-faint font-mono">{timeAgo(act.createdAt)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-center"
        >
          <button
            onClick={onLoadMore}
            className="btn-ghost px-6 py-3 rounded-[14px] text-[10px] font-bold uppercase tracking-wider text-accent border border-accent/20 hover:bg-accent/10 transition-all duration-200"
          >
            Load More Activity
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
