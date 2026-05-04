import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      country: true,
      platform: true,
      avatarUrl: true,
      createdAt: true,
      clubId: true,
    },
  });

  if (!user) notFound();

  const [ranking, stats, club] = await Promise.all([
    prisma.playerRanking.findUnique({ where: { userId: user.id } }),
    prisma.playerStats.findUnique({ where: { userId: user.id } }),
    user.clubId
      ? prisma.club.findUnique({
          where: { id: user.clubId },
          select: { id: true, name: true, tag: true, logoUrl: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-xl border border-[#333] bg-[#1a1a1a] bg-cover bg-center shrink-0 flex items-center justify-center">
            {(user.avatarUrl && (
              <img src={user.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
            )) || (
              <span className="bc-headline text-2xl text-[#00ff85]">
                {(user.displayName || user.username)[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="bc-headline text-3xl text-white truncate">
              {user.displayName || user.username}
            </h1>
            <p className="font-mono text-[11px] text-[#9a9a9a]">
              @{user.username} · {user.platform} · {user.country}
            </p>
            {user.bio && (
              <p className="text-sm text-[#9a9a9a] mt-1 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="Rank"
            value={ranking ? `#${ranking.rankPosition}` : "—"}
            accent={!!ranking}
          />
          <StatBox label="Points" value={ranking?.points ?? stats?.points ?? 0} />
          <StatBox
            label="Win Rate"
            value={
              stats && stats.matchesPlayed > 0
                ? `${Math.round((stats.wins / stats.matchesPlayed) * 100)}%`
                : "—"
            }
          />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MiniStat label="Played" value={stats?.matchesPlayed ?? 0} />
          <MiniStat label="Wins" value={stats?.wins ?? 0} />
          <MiniStat label="Draws" value={stats?.draws ?? 0} />
          <MiniStat label="Losses" value={stats?.losses ?? 0} />
        </div>

        {club && (
          <a
            href={`/club/${club.tag}`}
            className="block rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-4 hover:border-[#00ff85]/40 transition-colors"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a] mb-2">
              Club
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-lg border border-[#333] bg-black bg-cover bg-center shrink-0"
                style={{ backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined }}
              />
              <div>
                <p className="bc-headline text-lg text-white">{club.name}</p>
                <p className="font-mono text-[11px] text-[#9a9a9a]">[{club.tag}]</p>
              </div>
            </div>
          </a>
        )}

        {!club && (
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-6 text-center">
            <p className="font-mono text-[11px] text-[#9a9a9a]">Free Agent</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-4 " +
        (accent ? "border-[#00ff85]/30 bg-[#00ff85]/5" : "border-[#333] bg-[#1a1a1a]/50")
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">{label}</p>
      <p className="bc-headline text-2xl text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#333] bg-[#1a1a1a]/50 p-3 text-center">
      <p className="bc-headline text-xl text-white tabular-nums">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">{label}</p>
    </div>
  );
}