"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedTabs, TabContent, type Tab } from "@/components/ui/AnimatedTabs";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { FriendsPanel } from "@/components/FriendsPanel";

type UserData = {
  id: string;
  username: string;
  displayName: string | null;
  platform: string;
  country: string;
  avatarUrl: string | null;
  bio: string | null;
};

type StatsData = {
  points: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  goalsConceded: number;
  skillRating: number;
  winStreak: number;
  formScore: number;
  formHistory: string;
};

type RankingData = {
  rankPosition: number;
  points: number;
  prevPosition: number | null;
};

type ClubData = {
  id: string;
  name: string;
  slug: string;
  tag: string | null;
  logoUrl: string | null;
  membershipRole: string;
};

type TournamentData = {
  id: string;
  name: string;
  status: string;
  type: string;
  slug: string;
  participantStatus: string;
};

type LeagueData = {
  id: string;
  name: string;
  status: string;
  type: string;
  slug: string;
  standing: {
    points: number;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    position?: number;
  } | null;
};

type FixtureData = {
  id: string;
  matchday: number;
  homeUser: { username: string };
  awayUser: { username: string };
  league: { name: string };
};

type AchievementData = {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  rarity: string;
  unlockedAt: string;
};

type ActivityData = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type NotificationData = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type FriendData = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  playerRanking: { rankPosition: number } | null;
};

type HubProps = {
  user: UserData;
  stats: StatsData | null;
  ranking: RankingData | null;
  club: ClubData | null;
  activeTournaments: TournamentData[];
  activeLeagues: LeagueData[];
  upcomingFixtures: FixtureData[];
  achievements: AchievementData[];
  activities: ActivityData[];
  notifications: NotificationData[];
  friends: FriendData[];
};

export function PlayerHubClient({
  user,
  stats,
  ranking,
  club,
  activeTournaments,
  activeLeagues,
  upcomingFixtures,
  achievements,
  activities,
  notifications,
  friends,
}: HubProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const winRate =
    stats && stats.matchesPlayed > 0
      ? Math.round((stats.wins / stats.matchesPlayed) * 100)
      : null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const tabs: Tab[] = [
    { id: "overview", label: "Overview" },
    { id: "tournaments", label: "Tournaments", badge: activeTournaments.length },
    { id: "leagues", label: "Leagues", badge: activeLeagues.length },
    { id: "club", label: "Club" },
    { id: "achievements", label: "Achievements", badge: achievements.length },
    { id: "statistics", label: "Statistics" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-28 space-y-5">
      {/* ── Notification Bell ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">
          Player Hub
        </p>
        <Link
          href="/notifications"
          className="relative flex items-center gap-1.5 glass-v2-sm px-3 py-1.5 rounded-full"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-4 h-4 text-muted-soft"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center px-1 rounded-full bg-negative text-[8px] font-black text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </motion.div>

      {/* ── Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-v2 overflow-hidden"
      >
        <div className="p-5 sm:p-6 flex items-start gap-4 sm:gap-5">
          <div className="shrink-0">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-[18px] flex items-center justify-center text-xl sm:text-2xl font-bold overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(0,255,133,0.15), rgba(34,211,238,0.10))",
                border: "2px solid rgba(0,255,133,0.20)",
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-accent cinematic-heading">
                  {(user.displayName || user.username)[0].toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="cinematic-heading text-2xl sm:text-4xl text-ink truncate">
              {user.displayName || user.username}
            </h1>
            <p className="text-sm text-muted-soft mt-0.5">
              @{user.username} &middot; {user.platform}
              {ranking ? <>&middot; Rank #{ranking.rankPosition}</> : null}
            </p>
            {user.bio && (
              <p className="text-xs text-muted-faint mt-1.5 line-clamp-2">{user.bio}</p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {club && (
              <Link
                href={`/club/${club.slug}`}
                className="glass px-4 py-2 rounded-[14px] text-right hover:bg-white/[0.04] transition-colors"
              >
                <p className="text-[10px] text-muted-faint font-mono uppercase tracking-wider">
                  Club
                </p>
                <p className="text-sm font-bold text-accent">{club.name}</p>
                <p className="text-[9px] text-muted-faint uppercase tracking-wider">
                  {club.membershipRole}
                </p>
              </Link>
            )}
            <div className="glass px-4 py-2 rounded-[14px] text-right">
              <p className="text-[10px] text-muted-faint font-mono uppercase tracking-wider">
                Country
              </p>
              <p className="text-sm font-bold text-ink">{user.country}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        <StatBox label="Matches" value={stats?.matchesPlayed ?? 0} />
        <StatBox label="Wins" value={stats?.wins ?? 0} accent />
        <StatBox
          label="Win Rate"
          value={winRate !== null ? `${winRate}%` : "—"}
          accent={winRate !== null && winRate >= 50}
        />
        <StatBox label="Goals" value={stats?.goalsScored ?? 0} />
        <StatBox
          label="Form"
          value={
            stats && stats.formHistory
              ? stats.formHistory.slice(-5)
              : "—"
          }
          form
        />
      </motion.div>

      {/* ── Unread Notifications Banner ── */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-accent p-4 rounded-[20px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-accent">
              Unread ({unreadCount})
            </span>
          </div>
          <div className="space-y-2">
            {notifications
              .filter((n) => !n.isRead)
              .slice(0, 3)
              .map((n) => (
                <div key={n.id} className="text-xs text-muted-soft">
                  <span className="font-bold text-ink">{n.title}:</span>{" "}
                  {n.message}
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* ── Tabbed Interface ── */}
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        sticky
      />

      <TabContent id="overview" activeTab={activeTab}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTournaments.length > 0 && (
              <Section title={`Active Tournaments (${activeTournaments.length})`}>
                {activeTournaments.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.slug}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-accent transition-colors"
                  >
                    <span className="truncate">{t.name}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        t.status === "LIVE"
                          ? "text-negative"
                          : t.status === "REGISTRATION"
                          ? "text-gold"
                          : "text-accent"
                      }`}
                    >
                      {t.status}
                    </span>
                  </Link>
                ))}
              </Section>
            )}

            {activeLeagues.length > 0 && (
              <Section title={`Active Leagues (${activeLeagues.length})`}>
                {activeLeagues.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leagues/${l.slug}`}
                    className="flex items-center justify-between py-2 text-sm hover:text-accent transition-colors"
                  >
                    <span className="truncate">{l.name}</span>
                    {l.standing && (
                      <span className="text-[10px] text-muted-soft font-mono">
                        #{l.standing.position}
                      </span>
                    )}
                  </Link>
                ))}
              </Section>
            )}
          </div>

          {upcomingFixtures.length > 0 && (
            <Section title="Upcoming Fixtures">
              {upcomingFixtures.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between py-2.5 text-sm border-b border-border-faint last:border-0"
                >
                  <span className="text-muted-soft text-[11px]">
                    {f.league.name}
                  </span>
                  <span className="font-medium text-ink">
                    {f.homeUser.username} vs {f.awayUser.username}
                  </span>
                  <span className="text-[10px] text-muted-faint font-mono">
                    MD {f.matchday}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {activities.length > 0 && (
            <Section title="Recent Activity">
              {activities.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 py-2 text-sm border-b border-border-faint last:border-0"
                >
                  <ActivityIcon type={a.type} />
                  <span className="text-xs text-muted-soft flex-1">
                    {a.message}
                  </span>
                  <span className="text-[9px] text-muted-faint font-mono whitespace-nowrap">
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
              ))}
            </Section>
          )}
        </div>
      </TabContent>

      <TabContent id="tournaments" activeTab={activeTab}>
        {activeTournaments.length === 0 ? (
          <EmptyState
            title="No Tournaments"
            message="You haven't joined any tournaments yet."
            actionLabel="Browse Tournaments"
            actionHref="/tournaments"
          />
        ) : (
          <div className="space-y-3">
            {activeTournaments.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/tournaments/${t.slug}`}
                  className="card-interactive block p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink truncate">{t.name}</h3>
                      <p className="text-[10px] text-muted-faint mt-0.5 uppercase tracking-wider">
                        {t.type}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </TabContent>

      <TabContent id="leagues" activeTab={activeTab}>
        {activeLeagues.length === 0 ? (
          <EmptyState
            title="No Leagues"
            message="You're not in any leagues yet."
            actionLabel="Find Leagues"
            actionHref="/leagues"
          />
        ) : (
          <div className="space-y-3">
            {activeLeagues.map((l, i) => (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/leagues/${l.slug}`}
                  className="card-interactive block p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink truncate">{l.name}</h3>
                      <p className="text-[10px] text-muted-faint mt-0.5 uppercase tracking-wider">
                        {l.type}
                      </p>
                    </div>
                    <div className="text-right">
                      {l.standing && (
                        <p className="text-accent font-bold text-lg cinematic-heading">
                          #{l.standing.position}
                        </p>
                      )}
                      <StatusBadge status={l.status} />
                    </div>
                  </div>
                  {l.standing && (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-faint font-mono">P</p>
                        <p className="text-sm font-bold text-ink">{l.standing.played}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-faint font-mono">W</p>
                        <p className="text-sm font-bold text-accent">{l.standing.wins}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-faint font-mono">D</p>
                        <p className="text-sm font-bold text-gold">{l.standing.draws}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-faint font-mono">L</p>
                        <p className="text-sm font-bold text-negative">{l.standing.losses}</p>
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </TabContent>

      <TabContent id="club" activeTab={activeTab}>
        {!club ? (
          <EmptyState
            title="No Club"
            message="You're not a member of any club yet."
            actionLabel="Browse Clubs"
            actionHref="/clubs"
          />
        ) : (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-v2 p-5"
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-[16px] flex items-center justify-center text-lg font-bold"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,255,133,0.12), rgba(34,211,238,0.08))",
                    border: "1px solid rgba(0,255,133,0.15)",
                  }}
                >
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
                      alt={club.name}
                      className="h-full w-full object-cover rounded-[16px]"
                    />
                  ) : (
                    <span className="text-accent">{(club.name)[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="cinematic-heading text-2xl text-ink">{club.name}</h3>
                  {club.tag && (
                    <p className="text-sm text-accent font-bold">{club.tag}</p>
                  )}
                  <p className="text-[10px] text-muted-faint uppercase tracking-wider mt-1">
                    {club.membershipRole}
                  </p>
                </div>
              </div>
              <Link
                href={`/club/${club.slug}`}
                className="btn-ghost mt-4 w-full"
              >
                View Club Page
              </Link>
            </motion.div>

            <Section title="Club Activity">
              {activities.filter((a) => a.type.startsWith("CLUB_")).length === 0 ? (
                <p className="text-xs text-muted-soft text-center py-4">
                  No recent club activity
                </p>
              ) : (
                activities
                  .filter((a) => a.type.startsWith("CLUB_"))
                  .slice(0, 5)
                  .map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 py-2 text-sm border-b border-border-faint last:border-0"
                    >
                      <ActivityIcon type={a.type} />
                      <span className="text-xs text-muted-soft flex-1">
                        {a.message}
                      </span>
                      <span className="text-[9px] text-muted-faint font-mono whitespace-nowrap">
                        {timeAgo(a.createdAt)}
                      </span>
                    </div>
                  ))
              )}
            </Section>
          </div>
        )}
      </TabContent>

      <TabContent id="achievements" activeTab={activeTab}>
        {achievements.length === 0 ? (
          <EmptyState
            title="No Achievements"
            message="Complete matches and tournaments to earn achievements."
            actionLabel="Find a Match"
            actionHref="/matches"
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="frosted-card-sm p-4 text-center"
              >
                <span className="text-3xl block mb-2">{a.icon}</span>
                <h4 className="text-xs font-bold text-ink truncate">{a.title}</h4>
                {a.description && (
                  <p className="text-[9px] text-muted-faint mt-1 line-clamp-2">
                    {a.description}
                  </p>
                )}
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                    rarityColor(a.rarity)
                  }`}
                >
                  {a.rarity}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </TabContent>

      <TabContent id="statistics" activeTab={activeTab}>
        <div className="space-y-4">
          <Section title="Career Stats">
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailedStat label="Matches Played" value={stats.matchesPlayed} />
                <DetailedStat label="Wins" value={stats.wins} />
                <DetailedStat label="Losses" value={stats.losses} />
                <DetailedStat label="Draws" value={stats.draws} />
                <DetailedStat label="Goals Scored" value={stats.goalsScored} />
                <DetailedStat label="Goals Conceded" value={stats.goalsConceded} />
                <DetailedStat label="Win Rate" value={winRate !== null ? `${winRate}%` : "—"} />
                <DetailedStat label="Skill Rating" value={Math.round(stats.skillRating)} />
              </div>
            ) : (
              <p className="text-xs text-muted-soft text-center py-4">
                No stats available yet
              </p>
            )}
          </Section>

          {ranking && (
            <Section title="Ranking">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[10px] text-muted-faint uppercase tracking-wider">
                    Current Rank
                  </p>
                  <p className="text-3xl cinematic-heading text-accent mt-1">
                    #{ranking.rankPosition}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-faint uppercase tracking-wider">
                    Points
                  </p>
                  <p className="text-2xl font-bold text-ink mt-1">
                    {ranking.points.toLocaleString()}
                  </p>
                </div>
              </div>
              {ranking.prevPosition && ranking.prevPosition !== ranking.rankPosition && (
                <div className="flex items-center gap-1.5 mt-2 pt-3 border-t border-border-faint">
                  <span
                    className={`text-xs font-bold ${
                      ranking.rankPosition < ranking.prevPosition
                        ? "text-accent"
                        : "text-negative"
                    }`}
                  >
                    {ranking.rankPosition < ranking.prevPosition
                      ? `▲ ${ranking.prevPosition - ranking.rankPosition}`
                      : `▼ ${ranking.rankPosition - ranking.prevPosition}`}
                  </span>
                  <span className="text-[10px] text-muted-faint">
                    from #{ranking.prevPosition}
                  </span>
                </div>
              )}
            </Section>
          )}
        </div>
      </TabContent>

      {/* ── Friends Panel ── */}
      <FriendsPanel currentUserId={user.id} />

      {/* ── Footer Links ── */}
      <div className="flex items-center justify-center gap-4 pt-4">
        <Link
          href="/dashboard/edit-profile"
          className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
        >
          Edit Profile
        </Link>
        <span className="text-muted-faint">&middot;</span>
        <Link
          href="/matches"
          className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline"
        >
          Find Match
        </Link>
        <span className="text-muted-faint">&middot;</span>
        <a
          href="/api/auth/logout"
          className="text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-negative transition-colors"
        >
          Sign Out
        </a>
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent = false,
  form = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
  form?: boolean;
}) {
  return (
    <div className="frosted-card-sm p-3.5 rounded-[20px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
        {label}
      </p>
      {form && typeof value === "string" ? (
        <div className="flex items-center gap-1 mt-2">
          {value
            .slice(-5)
            .split("")
            .map((ch, i) => (
              <span
                key={i}
                className={`form-dot ${
                  ch === "W"
                    ? "form-dot-win"
                    : ch === "D"
                    ? "form-dot-draw"
                    : ch === "L"
                    ? "form-dot-loss"
                    : ""
                }`}
              />
            ))}
        </div>
      ) : (
        <p
          className={`cinematic-heading text-2xl mt-1 tabular-nums ${
            accent ? "text-accent" : "text-ink"
          }`}
        >
          {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
        </p>
      )}
    </div>
  );
}

function DetailedStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-faint">
        {label}
      </p>
      <p className="text-xl font-bold text-ink mt-1 tabular-nums">
        {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
      </p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="frosted-card overflow-hidden rounded-[24px]">
      <div className="px-5 py-3 border-b border-border-faint">
        <h2 className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-soft">
          {title}
        </h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({
  title,
  message,
  actionLabel,
  actionHref,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="frosted-card p-8 text-center rounded-[24px]">
      <p className="text-lg font-bold text-muted-soft">{title}</p>
      <p className="text-xs text-muted-faint mt-2 max-w-xs mx-auto">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="btn-ghost mt-4 inline-flex"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    LIVE: "text-negative bg-negative/10 border border-negative/20",
    REGISTRATION: "text-gold bg-gold/10 border border-gold/20",
    ACTIVE: "text-accent bg-accent/10 border border-accent/20",
    COMPLETED: "text-muted-soft bg-white/[0.04] border border-border",
    DRAFT: "text-muted-faint bg-white/[0.02] border border-border-faint",
    PENDING: "text-muted-soft bg-white/[0.04] border border-border",
  };

  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
        colorMap[status] || colorMap.PENDING
      }`}
    >
      {status}
    </span>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    MATCH_WON: "W",
    MATCH_LOST: "L",
    MATCH_DRAW: "D",
    TOURNAMENT_JOINED: "T",
    TOURNAMENT_WON: "T",
    LEAGUE_JOINED: "L",
    CLUB_JOINED: "C",
    ACHIEVEMENT_UNLOCKED: "A",
    RANK_CHANGED: "R",
  };

  const icon = icons[type] || "•";
  const colorMap: Record<string, string> = {
    MATCH_WON: "text-accent bg-accent/10",
    TOURNAMENT_WON: "text-gold bg-gold/10",
    MATCH_LOST: "text-negative bg-negative/10",
    ACHIEVEMENT_UNLOCKED: "text-purple bg-purple/10",
    RANK_CHANGED: "text-cyan bg-cyan/10",
  };

  return (
    <span
      className={`h-6 w-6 rounded-[8px] flex items-center justify-center text-[10px] font-black ${
        colorMap[type] || "text-muted-soft bg-white/[0.04]"
      }`}
    >
      {icon}
    </span>
  );
}

function rarityColor(rarity: string): string {
  switch (rarity) {
    case "LEGENDARY":
      return "text-gold bg-gold/10 border border-gold/20";
    case "EPIC":
      return "text-purple bg-purple/10 border border-purple/20";
    case "RARE":
      return "text-cyan bg-cyan/10 border border-cyan/20";
    default:
      return "text-muted-soft bg-white/[0.04] border border-border-faint";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
