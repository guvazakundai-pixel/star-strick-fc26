import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rankings · Star Strick FC26",
  description: "Live rankings for Zimbabwe's competitive EA Sports FC season.",
};

type PlayerRow = {
  pr_id: string;
  rank_position: number;
  points: number;
  rank_change: number;
  final_score: number;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  platform: string | null;
  club_id: string | null;
  club_name: string | null;
  club_tag: string | null;
  wins: number;
  draws: number;
  losses: number;
  win_streak: number;
};

export default async function RankingsPage() {
  const result = await db.execute(`
    SELECT
      pr.id as pr_id, pr.rank_position, pr.points, pr.rank_change, pr.final_score,
      u.id as user_id, u.username, u.display_name, u.avatar_url, u.platform, u.club_id,
      c.name as club_name, c.tag as club_tag,
      ps.wins, ps.draws, ps.losses, ps.win_streak
    FROM player_rankings pr
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN clubs c ON c.id = u.club_id
    LEFT JOIN player_stats ps ON ps.user_id = u.id
    ORDER BY pr.rank_position ASC
    LIMIT 50
  `);

  const players = result.rows as unknown as PlayerRow[];

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <header className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Live Rankings
          </p>
          <h1 className="cinematic-heading mt-2 text-5xl sm:text-7xl text-ink leading-[0.88]">
            Player Rankings
          </h1>
          <p className="mt-2 text-sm text-muted max-w-lg">
            Season 1 standings — top 50 players in Zimbabwe
          </p>
        </header>

        {players.length === 0 && (
          <div className="glass p-12 text-center space-y-4">
            <p className="cinematic-heading text-3xl text-ink">No rankings yet</p>
            <p className="text-sm text-muted">
              Sign up and compete to appear on the leaderboard!
            </p>
          </div>
        )}

        <div className="space-y-2">
          {players.map((player, idx) => {
            const change = player.rank_change;
            const isTop3 = player.rank_position <= 3;
            return (
              <Link
                key={player.pr_id}
                href={`/player/${player.username}`}
                className="block frosted-card-sm p-4 sm:p-5 hover:border-accent/18 transition-all duration-200 group bc-stagger-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 text-center shrink-0">
                    <span
                      className={
                        "bc-headline tabular-nums " +
                        (player.rank_position === 1
                          ? "text-2xl sm:text-3xl text-gradient-gold rank-glow-gold"
                          : player.rank_position === 2
                            ? "text-2xl sm:text-3xl text-[#C8C8D2] rank-glow-silver"
                            : player.rank_position === 3
                              ? "text-2xl sm:text-3xl text-[#CD7F32] rank-glow-bronze"
                            : "text-xl text-muted-faint")
                      }
                    >
                      {player.rank_position}
                    </span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-[12px] border border-border-faint bg-bg-elevated shrink-0 flex items-center justify-center bg-cover bg-center overflow-hidden"
                    style={{
                      backgroundImage: player.avatar_url
                        ? `url(${player.avatar_url})`
                        : undefined,
                      ...(isTop3 ? { boxShadow: `0 0 16px ${player.rank_position === 1 ? "rgba(255,184,0,0.15)" : player.rank_position === 2 ? "rgba(200,200,210,0.12)" : "rgba(205,127,50,0.12)"}` } : {}),
                    }}
                  >
                    {!player.avatar_url && (
                      <span className="text-[10px] font-bold text-accent">
                        {(player.display_name || player.username)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors duration-200 truncate">
                      {player.display_name || player.username}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-muted-soft">
                      <span>@{player.username}</span>
                      {player.club_tag && <span className="text-accent/60">[{player.club_tag}]</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="bc-headline text-lg text-accent tabular-nums">
                      {player.points}
                    </p>
                    {change !== 0 && (
                      <p
                        className={
                          "font-mono text-[10px] tabular-nums " +
                          (change > 0 ? "text-accent" : "text-negative/80")
                        }
                      >
                        {change > 0 ? "▲" : "▼"} {Math.abs(change)}
                      </p>
                    )}
                  </div>
                  {player.wins != null && (
                    <div className="hidden sm:flex items-center gap-2.5 font-mono text-[10px] text-muted-soft shrink-0">
                      <span className="text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
                      <span>{player.draws}<span className="text-muted-faint">D</span></span>
                      <span className="text-negative/70">{player.losses}<span className="text-muted-faint">L</span></span>
                      {player.win_streak > 0 && (
                        <span className="text-accent">
                          🔥{player.win_streak}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}