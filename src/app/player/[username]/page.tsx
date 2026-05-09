import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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

  const [ranking, stats, club, recentMatches] = await Promise.all([
    prisma.playerRanking.findUnique({ where: { userId: user.id } }),
    prisma.playerStats.findUnique({ where: { userId: user.id } }),
    user.clubId
      ? prisma.club.findUnique({
          where: { id: user.clubId },
          select: { id: true, name: true, tag: true, slug: true, logoUrl: true },
        })
      : Promise.resolve(null),
    prisma.matchReport.findMany({
      where: {
        OR: [{ player1Id: user.id }, { player2Id: user.id }],
        status: { in: ["CONFIRMED", "APPROVED"] },
      },
      include: {
        player1: { select: { id: true, username: true, displayName: true } },
        player2: { select: { id: true, username: true, displayName: true } },
        winner: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const formStr = stats?.formHistory
    ? (stats.formHistory as string).slice(-5)
    : "";
  const formArr = formStr.split("") as ("W" | "L" | "D")[];
  const matchesPlayed = stats?.matchesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const draws = stats?.draws ?? 0;
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
  const goalDiff = (stats?.goalsScored ?? 0) - (stats?.goalsConceded ?? 0);
  const skillRating = stats?.skillRating ?? 1000;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="glass p-6">
          <div className="flex items-center gap-4">
            <div
              className="relative h-20 w-20 rounded-[18px] border border-border-faint bg-bg-elevated bg-cover bg-center shrink-0 flex items-center justify-center"
              style={{
                boxShadow: ranking && ranking.rankPosition <= 3 ? `0 0 30px ${ranking.rankPosition === 1 ? "rgba(255,184,0,0.25)" : ranking.rankPosition === 2 ? "rgba(192,192,192,0.2)" : "rgba(205,127,50,0.2)"}` : "0 8px 24px rgba(0,0,0,0.25)",
                ...(user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}),
              }}
            >
              {!user.avatarUrl && (
                <span className="bc-headline text-3xl text-accent">
                  {(user.displayName || user.username)[0].toUpperCase()}
                </span>
              )}
              {ranking && ranking.rankPosition <= 3 && (
                <span
                  className={
                    "absolute -top-1 -right-1 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black " +
                    (ranking.rankPosition === 1
                      ? "bg-gold text-bg"
                      : ranking.rankPosition === 2
                        ? "bg-[#C0C0C0] text-bg"
                        : "bg-[#CD7F32] text-bg")
                  }
                >
                  {ranking.rankPosition}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="bc-headline text-3xl text-ink truncate">
                  {user.displayName || user.username}
                </h1>
                {ranking && (
                  <span className="shrink-0 pill-accent rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    #{ranking.rankPosition}
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted-soft">
                @{user.username} · {user.platform} · {user.country}
              </p>
              {user.bio && (
                <p className="text-sm text-muted mt-1 line-clamp-2">{user.bio}</p>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatBox
            label="Rank"
            value={ranking ? `#${ranking.rankPosition}` : "—"}
            accent={!!ranking}
          />
          <StatBox label="Points" value={ranking?.points ?? stats?.points ?? 0} />
          <StatBox label="Win Rate" value={`${winRate}%`} />
        </div>

        <div className="grid grid-cols-4 gap-3">
          <MiniStat label="Played" value={matchesPlayed} />
          <MiniStat label="Wins" value={wins} accent />
          <MiniStat label="Draws" value={draws} />
          <MiniStat label="Losses" value={losses} negative />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Goals" value={stats?.goalsScored ?? 0} />
          <MiniStat
            label="GD"
            value={goalDiff >= 0 ? `+${goalDiff}` : `${goalDiff}`}
            accent={goalDiff > 0}
            negative={goalDiff < 0}
          />
          <MiniStat label="Skill" value={Math.round(skillRating)} />
        </div>

        {formArr.length > 0 && (
          <section className="frosted-card p-4">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-3">
              Recent Form
            </h2>
            <div className="flex items-center gap-2">
              {formArr.map((r, i) => (
                <span
                  key={i}
                  className={
                    "inline-grid place-items-center h-10 w-10 rounded-[10px] text-sm font-bold " +
                    (r === "W"
                      ? "bg-accent/15 text-accent border border-accent/25"
                      : r === "L"
                        ? "bg-negative/12 text-negative border border-negative/20"
                        : "bg-bg-highlight text-ink-soft border border-border-faint")
                  }
                >
                  {r}
                </span>
              ))}
            </div>
          </section>
        )}

        {stats && stats.winStreak > 0 && (
          <div className="frosted-card-sm p-4 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
              Win Streak
            </span>
            <span className="flex items-center gap-1 bc-headline text-xl text-accent">
              {stats.winStreak}
              <span className="text-[10px] text-muted-soft font-mono uppercase tracking-wider">fires</span>
            </span>
          </div>
        )}

        {club && (
          <Link
            href={`/club/${club.slug ?? club.tag ?? club.id}`}
            className="block frosted-card p-4 hover:border-accent/18 transition-all duration-200"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft mb-2">
              Club
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-[12px] border border-border-faint bg-bg-elevated bg-cover bg-center shrink-0 flex items-center justify-center"
                style={{ backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined }}
              >
                {!club.logoUrl && (
                  <span className="bc-headline text-xl text-accent">{club.tag?.[0] ?? club.name[0]}</span>
                )}
              </div>
              <div>
                <p className="bc-headline text-lg text-ink">{club.name}</p>
                <p className="font-mono text-[11px] text-muted-soft">[{club.tag}]</p>
              </div>
            </div>
          </Link>
        )}

        {!club && (
          <div className="frosted-card p-6 text-center">
            <p className="font-mono text-[11px] text-muted-soft">Free Agent</p>
          </div>
        )}

        {recentMatches.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">
              Recent Matches
            </h2>
            <div className="space-y-2">
              {recentMatches.map((m) => {
                const isP1 = m.player1Id === user.id;
                const opponent = isP1 ? m.player2 : m.player1;
                const myScore = isP1 ? m.score1 : m.score2;
                const oppScore = isP1 ? m.score2 : m.score1;
                const didWin = m.winnerId === user.id;
                const isDraw = !m.winnerId;

                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block frosted-card-sm p-3 hover:border-accent/15 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={
                            "shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-[10px] font-bold " +
                            (didWin
                              ? "bg-accent/15 text-accent"
                              : isDraw
                                ? "bg-gold/15 text-gold"
                                : "bg-negative/12 text-negative")
                          }
                        >
                          {didWin ? "W" : isDraw ? "D" : "L"}
                        </span>
                        <span className="text-sm text-ink truncate">
                          vs {opponent.displayName || opponent.username}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 font-mono text-sm tabular-nums">
                        <span className={didWin ? "text-accent" : isDraw ? "text-gold" : "text-ink"}>
                          {myScore}
                        </span>
                        <span className="text-muted-faint">:</span>
                        <span className={!didWin && !isDraw ? "text-accent" : "text-ink"}>
                          {oppScore}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="text-center text-[10px] text-muted-faint font-mono pt-2">
          Joined {user.createdAt.toLocaleDateString(undefined, { month: "short", year: "numeric" })}
        </div>
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
        "frosted-card-sm p-4 " +
        (accent ? "!border-accent/15 !bg-accent/5" : "")
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl text-ink mt-1 tabular-nums " + (accent ? "text-accent" : "")}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, accent, negative }: { label: string; value: number | string; accent?: boolean; negative?: boolean }) {
  return (
    <div className="frosted-card-sm p-3 text-center">
      <p className={"bc-headline text-xl tabular-nums " + (accent ? "text-accent" : negative ? "text-negative" : "text-ink")}>{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-soft">{label}</p>
    </div>
  );
}