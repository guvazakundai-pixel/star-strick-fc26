import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

function safeStr(val: unknown, fallback = ""): string {
  if (val === null || val === undefined) return fallback;
  return String(val || fallback);
}

function safeNum(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const userRes = await db.execute({
    sql: `SELECT id, username, display_name, email, role, platform, country, bio, avatar_url, club_id, is_banned, created_at FROM users WHERE id = ?`,
    args: [session.userId],
  });
  const userRow = userRes.rows[0] as Record<string, unknown> | undefined;
  if (!userRow) redirect("/login");

  const userId = String(userRow.id);
  const displayName = safeStr(userRow.display_name) || safeStr(userRow.username);
  const username = safeStr(userRow.username);
  const platform = safeStr(userRow.platform);
  const country = safeStr(userRow.country);
  const clubId = safeStr(userRow.club_id);
  const isBanned = userRow.is_banned === 1 || userRow.is_banned === true;
  const isAdmin = session.role === "ADMIN" || session.role === "MANAGER";

  const [rankingRes, statsRes, clubRes, pointsRes] = await Promise.all([
    db.execute({ sql: "SELECT rank_position, points FROM player_rankings WHERE user_id = ?", args: [userId] }),
    db.execute({ sql: "SELECT points, matches_played, wins, losses, win_streak FROM player_stats WHERE user_id = ?", args: [userId] }),
    clubId ? db.execute({ sql: "SELECT id, name, slug, tag, logo_url FROM clubs WHERE id = ?", args: [clubId] }) : Promise.resolve({ rows: [] }),
    db.execute({ sql: "SELECT id, points_change, reason, created_at FROM points_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 10", args: [userId] }),
  ]);

  const ranking = rankingRes.rows[0] as Record<string, unknown> | undefined;
  const stats = statsRes.rows[0] as Record<string, unknown> | undefined;
  const club = clubRes.rows?.[0] as Record<string, unknown> | undefined;
  const pointsLogs = pointsRes.rows as Record<string, unknown>[];

  const rankPos = ranking ? safeNum(ranking.rank_position) : null;
  const rankPoints = ranking ? safeNum(ranking.points) : safeNum(stats?.points, 0);
  const winRate = stats && safeNum(stats.matches_played) > 0 ? Math.round((safeNum(stats.wins) / safeNum(stats.matches_played)) * 100) : null;
  const winStreak = stats ? safeNum(stats.win_streak) : 0;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Player Dashboard</p>
            <h1 className="bc-headline text-3xl text-ink mt-0.5">{displayName}</h1>
            <p className="font-mono text-[11px] text-muted-soft mt-0.5">@{username} · {platform} · {country}</p>
          </div>
          {isAdmin && (
            <Link href="/admin" className="rounded-[12px] pill-accent px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-accent/12 transition-all duration-200">Admin Panel</Link>
          )}
        </header>

        {isBanned && (
          <div className="rounded-[16px] border border-negative/25 px-4 py-3 text-sm text-negative/90" style={{ background: "rgba(255,51,51,0.06)" }}>
            Your account has been suspended.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Rank" value={rankPos ? `#${rankPos}` : "—"} variant="cyan" />
          <StatCard label="Points" value={rankPoints} accent variant="emerald" />
          <StatCard label="Win Rate" value={winRate !== null ? `${winRate}%` : "—"} variant="orange" />
          <StatCard label="Streak" value={winStreak} />
        </div>

        <section className="frosted-card overflow-hidden rounded-[24px]">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Club</h2>
          </div>
          <div className="p-5">
            {club ? (
              <Link href={`/club/${safeStr(club.slug)}`} className="flex items-center gap-3.5 group">
                <div
                  className="h-12 w-12 rounded-[14px] border border-white/[0.06] bg-cover bg-center shrink-0"
                  style={{
                    backgroundImage: safeStr(club.logo_url) ? `url(${safeStr(club.logo_url)})` : undefined,
                    background: safeStr(club.logo_url) ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                  }}
                />
                <div>
                  <p className="bc-headline text-lg text-ink group-hover:text-accent transition-colors duration-300">{safeStr(club.name)}</p>
                  <p className="font-mono text-[11px] text-muted-soft">[{safeStr(club.tag)}]</p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted text-sm">You are a free agent</p>
              </div>
            )}
          </div>
        </section>

        <section className="frosted-card overflow-hidden rounded-[24px]">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Recent Points</h2>
          </div>
          {pointsLogs.length === 0 ? (
            <div className="p-5 text-center text-sm text-muted">No points yet.</div>
          ) : (
            <ul className="divide-y divide-white/[0.03]">
              {pointsLogs.map((pe) => {
                const change = safeNum(pe.points_change);
                return (
                  <li key={safeStr(pe.id)} className="px-5 py-3.5 flex items-center justify-between transition-colors duration-200 hover:bg-white/[0.02]">
                    <span className="text-sm text-ink">{safeStr(pe.reason)}</span>
                    <span className={"font-mono text-sm font-bold " + (change >= 0 ? "text-accent" : "text-negative/90")}>{change >= 0 ? "+" : ""}{change}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="text-center">
          <Link href="/dashboard/edit-profile" className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline">Edit Profile</Link>
          <span className="text-muted-faint mx-2">·</span>
          <a href="/api/auth/logout" className="text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-negative/90 transition-colors duration-200">Sign Out</a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, variant }: { label: string; value: string | number; accent?: boolean; variant?: "cyan" | "emerald" | "orange" | "purple" }) {
  const variantClass = variant === "cyan" ? "glass-cyan" : variant === "emerald" ? "glass-emerald" : variant === "orange" ? "glass-orange" : variant === "purple" ? "glass-purple" : "";
  return (
    <div className={`${variantClass || "frosted-card-sm"} p-3.5 rounded-[20px]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl mt-1 tabular-nums " + (accent ? "text-accent" : "text-ink")}>{value}</p>
    </div>
  );
}