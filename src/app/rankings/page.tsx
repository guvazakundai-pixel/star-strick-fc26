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

function rankTone(pos: number) {
  if (pos === 1) return { bg: "rgba(22,24,29,0.50)", border: "rgba(255,184,0,0.18)", shadow: "0 8px 36px rgba(255,184,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)", glow: "rgba(255,184,0,0.24)", rankText: "text-gradient-gold rank-glow-gold", avatarShadow: "0 0 20px rgba(255,184,0,0.18)" };
  if (pos === 2) return { bg: "rgba(22,24,29,0.48)", border: "rgba(200,200,210,0.16)", shadow: "0 8px 36px rgba(200,200,210,0.06), inset 0 1px 0 rgba(255,255,255,0.05)", glow: "rgba(200,200,210,0.20)", rankText: "text-[#C8C8D2] rank-glow-silver", avatarShadow: "0 0 16px rgba(200,200,210,0.14)" };
  if (pos === 3) return { bg: "rgba(22,24,29,0.48)", border: "rgba(205,127,50,0.16)", shadow: "0 8px 36px rgba(205,127,50,0.06), inset 0 1px 0 rgba(255,255,255,0.04)", glow: "rgba(205,127,50,0.20)", rankText: "text-[#CD7F32] rank-glow-bronze", avatarShadow: "0 0 16px rgba(205,127,50,0.14)" };
  return { bg: "rgba(18,20,24,0.32)", border: "rgba(255,255,255,0.04)", shadow: "0 4px 20px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.03)", glow: "rgba(0,255,133,0.10)", rankText: "text-muted-faint", avatarShadow: "none" };
}

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
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(600px 250px at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
          <header>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan/18 px-3.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-cyan mb-4" style={{ background: "rgba(34,211,238,0.06)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan bc-pulse-red" style={{ boxShadow: "0 0 6px rgba(34,211,238,0.50)" }} />
              Top 50 · Season 1
            </div>
            <h1 className="cinematic-heading text-5xl sm:text-7xl md:text-8xl text-ink leading-[0.88]">
              Player<br />
              <span className="text-gradient-cyan-blue">Rankings</span>
            </h1>
            <p className="mt-3 text-sm sm:text-[15px] text-muted max-w-lg">
              Zimbabwe&apos;s elite EA FC players — ranked by skill, wins, and consistency.
            </p>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-28">
        {players.length === 0 ? (
          <div className="glass p-12 text-center space-y-4">
            <p className="cinematic-heading text-3xl text-ink">No rankings yet</p>
            <p className="text-sm text-muted">
              Sign up and compete to appear on the leaderboard!
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-2.5">
            {players.map((player, idx) => {
              const tone = rankTone(player.rank_position);
              const change = player.rank_change;
              const isTop3 = player.rank_position <= 3;

              return (
                <Link
                  key={player.pr_id}
                  href={`/player/${player.username}`}
                  className="block bc-stagger-in transition-all duration-300 group"
                  style={{ animationDelay: `${idx * 35}ms` }}
                >
                  <div
                    className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 transition-all duration-400 bc-row-glow"
                    style={{
                      background: tone.bg,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${tone.border}`,
                      boxShadow: isTop3
                        ? tone.shadow
                        : "0 4px 20px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.03)",
                      ["--row-glow" as string]: tone.glow,
                    }}
                  >
                    {isTop3 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.03]"
                        style={{
                          background: `radial-gradient(200px 80px at 10% 50%, ${player.rank_position === 1 ? "rgba(255,184,0,1)" : player.rank_position === 2 ? "rgba(200,200,210,1)" : "rgba(205,127,50,1)"}, transparent 70%)`,
                        }}
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                      <div className="w-10 sm:w-12 text-center shrink-0">
                        <span className={`bc-headline tabular-nums text-2xl sm:text-3xl ${tone.rankText}`}>
                          {player.rank_position}
                        </span>
                      </div>
                      <div
                        className="h-10 w-10 sm:h-11 sm:w-11 rounded-[14px] border border-border-faint shrink-0 flex items-center justify-center bg-cover bg-center overflow-hidden"
                        style={{
                          backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined,
                          boxShadow: isTop3 ? tone.avatarShadow : "none",
                          background: player.avatar_url ? undefined : "rgba(22,24,28,0.80)",
                        }}
                      >
                        {!player.avatar_url && (
                          <span className="text-[11px] font-bold text-accent">
                            {(player.display_name || player.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink group-hover:text-accent transition-colors duration-300 truncate">
                          {player.display_name || player.username}
                        </p>
                        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-soft mt-0.5">
                          <span>@{player.username}</span>
                          {player.club_tag && <span className="text-accent/50">[{player.club_tag}]</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="bc-headline text-lg sm:text-xl text-accent tabular-nums">
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
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}