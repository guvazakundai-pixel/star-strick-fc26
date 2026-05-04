import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Rankings · Star Strick FC26",
  description:
    "Live rankings for Zimbabwe's competitive EA Sports FC season.",
};

export default async function RankingsPage() {
  const players = await prisma.playerRanking.findMany({
    orderBy: { rankPosition: "asc" },
    select: {
      id: true,
      rankPosition: true,
      points: true,
      rankChange: true,
      finalScore: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          platform: true,
          clubId: true,
        },
      },
    },
    take: 50,
  });

  const playerIds = players.map((p) => p.user.id);
  const stats = await prisma.playerStats.findMany({
    where: { userId: { in: playerIds } },
    select: {
      userId: true,
      matchesPlayed: true,
      wins: true,
      draws: true,
      losses: true,
      winStreak: true,
    },
  });
  const statsMap = new Map(stats.map((s) => [s.userId, s]));

  const clubIds = players.map((p) => p.user.clubId).filter(Boolean) as string[];
  const clubs = await prisma.club.findMany({
    where: { id: { in: clubIds } },
    select: { id: true, name: true, tag: true, logoUrl: true },
  });
  const clubMap = new Map(clubs.map((c) => [c.id, c]));

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
            const s = statsMap.get(player.user.id);
            const club = player.user.clubId ? clubMap.get(player.user.clubId) : null;
            const change = player.rankChange;
            return (
              <Link
                key={player.id}
                href={`/player/${player.user.username}`}
                className="block rounded-lg border border-[#333] bg-[#1a1a1a]/60 p-3 sm:p-4 hover:border-[#00ff85]/30 transition-colors group bc-stagger-in"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 text-center shrink-0">
                    <span
                      className={
                        "bc-headline text-xl tabular-nums " +
                        (player.rankPosition === 1
                          ? "text-[#ffb800]"
                          : player.rankPosition === 2
                            ? "text-[#c0c0c0]"
                            : player.rankPosition === 3
                              ? "text-[#cd7f32]"
                              : "text-white")
                      }
                    >
                      #{player.rankPosition}
                    </span>
                  </div>
                  <div
                    className="h-10 w-10 rounded-lg border border-[#333] bg-black shrink-0 flex items-center justify-center bg-cover bg-center"
                    style={{
                      backgroundImage: player.user.avatarUrl
                        ? `url(${player.user.avatarUrl})`
                        : undefined,
                    }}
                  >
                    {!player.user.avatarUrl && (
                      <span className="text-[10px] font-bold text-[#00ff85]">
                        {(player.user.displayName || player.user.username)[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white group-hover:text-[#00ff85] transition-colors truncate">
                      {player.user.displayName || player.user.username}
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#9a9a9a]">
                      <span>@{player.user.username}</span>
                      {club && <span>[{club.tag}]</span>}
                      <span>{player.user.platform}</span>
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
                  {s && (
                    <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-[#666] shrink-0">
                      <span>{s.wins}W</span>
                      <span>{s.draws}D</span>
                      <span>{s.losses}L</span>
                      {s.winStreak > 0 && (
                        <span className="text-[#00ff85]">
                          🔥{s.winStreak}
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