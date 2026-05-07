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
        <header className="mb-6">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">
            Live Rankings
          </p>
          <h1 className="bc-headline mt-1 text-3xl sm:text-5xl text-white">
            Player Rankings
          </h1>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Season 1 standings — top 50 players in Zimbabwe
          </p>
        </header>

        {players.length === 0 && (
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-10 text-center space-y-3">
            <p className="bc-headline text-2xl text-white">No rankings yet</p>
            <p className="text-sm text-[#9a9a9a]">
              Sign up and compete to appear on the leaderboard!
            </p>
          </div>
        )}

        <div className="space-y-2">
          {players.map((player, idx) => {
            const change = player.rank_change;
            return (
              <Link
                key={player.pr_id}
                href={`/player/${player.username}`}
                className="block rounded-lg border border-[#333] bg-[#1a1a1a]/60 p-3 sm:p-4 hover:border-[#00ff85]/30 transition-colors group bc-stagger-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 text-center shrink-0">
                    <span
                      className={
                        "bc-headline text-xl tabular-nums " +
                        (player.rank_position === 1
                          ? "text-[#ffb800]"
                          : player.rank_position === 2
                            ? "text-[#c0c0c0]"
                            : player.rank_position === 3
                              ? "text-[#cd7f32]"
                              : "text-white")
                      }
                    >
                      #{player.rank_position}
                    </span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-lg border border-[#333] bg-black shrink-0 flex items-center justify-center bg-cover bg-center"
                    style={{
                      backgroundImage: player.avatar_url
                        ? `url(${player.avatar_url})`
                        : undefined,
                    }}
                  >
                    {!player.avatar_url && (
                      <span className="text-[10px] font-bold text-[#00ff85]">
                        {(player.display_name || player.username)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-[#00ff85] transition-colors truncate">
                      {player.display_name || player.username}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#9a9a9a]">
                      <span>@{player.username}</span>
                      {player.club_tag && <span>[{player.club_tag}]</span>}
                      <span>{player.platform}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="bc-headline text-lg text-[#00ff85] tabular-nums">
                      {player.points}
                    </p>
                    {change !== 0 && (
                      <p
                        className={
                          "font-mono text-[10px] tabular-nums " +
                          (change > 0 ? "text-[#00ff85]" : "text-red-400")
                        }
                      >
                        {change > 0 ? "▲" : "▼"} {Math.abs(change)}
                      </p>
                    )}
                  </div>
                  {player.wins != null && (
                    <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-[#666] shrink-0">
                      <span>{player.wins}W</span>
                      <span>{player.draws}D</span>
                      <span>{player.losses}L</span>
                      {player.win_streak > 0 && (
                        <span className="text-[#00ff85]">
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