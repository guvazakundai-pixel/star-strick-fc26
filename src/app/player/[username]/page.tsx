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
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <header className="relative overflow-hidden rounded-[28px] inner-glow" style={{ background: "rgba(18,20,24,0.45)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", border: "1px solid rgba(255,255,255,0.04)" }}>
          {ranking && ranking.rankPosition <= 3 && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[inherit]"
              style={{
                background: ranking.rankPosition === 1
                  ? "radial-gradient(400px 200px at 30% 50%, rgba(255,184,0,0.08), transparent 70%)"
                  : ranking.rankPosition === 2
                  ? "radial-gradient(400px 200px at 30% 50%, rgba(200,200,210,0.06), transparent 70%)"
                  : "radial-gradient(400px 200px at 30% 50%, rgba(205,127,50,0.06), transparent 70%)",
              }}
            />
          )}
          <div className="relative z-10 p-6">
            <div className="flex items-center gap-4">
              <div
                className="relative h-20 w-20 rounded-[20px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center"
                style={{
                  boxShadow: ranking && ranking.rankPosition <= 3
                    ? `0 0 32px ${ranking.rankPosition === 1 ? "rgba(255,184,0,0.25)" : ranking.rankPosition === 2 ? "rgba(192,192,192,0.2)" : "rgba(205,127,50,0.2)"}`
                    : "0 8px 28px rgba(0,0,0,0.25)",
                  background: user.avatarUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
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
                      "absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black " +
                      (ranking.rankPosition === 1
                        ? "bg-gold text-[#0D0D0F]"
                        : ranking.rankPosition === 2
                        ? "bg-[#C0C0C0] text-[#0D0D0F]"
                        : "bg-[#CD7F32] text-[#0D0D0F]")
                    }
                    style={{ boxShadow: ranking.rankPosition === 1 ? "0 2px 8px rgba(255,184,0,0.40)" : "none" }}
                  >
                    {ranking.rankPosition}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h1 className="bc-headline text-3xl text-ink truncate">
                    {user.displayName || user.username}
                  </h1>
                  {ranking && (
                    <span className="shrink-0 pill-accent rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      #{ranking.rankPosition}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[11px] text-muted-soft mt-0.5">
                  @{user.username} · {user.platform} · {user.country}
                </p>
                {user.bio && (
                  <p className="text-sm text-muted mt-1.5 line-clamp-2">{user.bio}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Rank" value={ranking ? `#${ranking.rankPosition}` : "—"} accent={!!ranking} variant="cyan" />
          <StatBox label="Points" value={ranking?.points ?? stats?.points ?? 0} variant="emerald" />
          <StatBox label="Win Rate" value={`${winRate}%`} variant="orange" />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <MiniStat label="Played" value={matchesPlayed} />
          <MiniStat label="Wins" value={wins} accent />
          <MiniStat label="Draws" value={draws} />
          <MiniStat label="Losses" value={losses} negative />
        </div>

        <div className="grid grid-cols-3 gap-2.5">
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
          <section className="frosted-card p-4 sm:p-5 rounded-[24px]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-3">
              Recent Form
            </h2>
            <div className="flex items-center gap-2.5">
              {formArr.map((r, i) => (
                <span
                  key={i}
                  className={
                    "inline-grid place-items-center h-11 w-11 rounded-[12px] text-sm font-bold transition-all duration-200 " +
                    (r === "W"
                      ? "bg-emerald/10 text-emerald border border-emerald/20"
                      : r === "L"
                      ? "bg-negative/10 text-negative border border-negative/16"
                      : "bg-white/[0.03] text-ink-soft border border-white/[0.05]")
                  }
                >
                  {r}
                </span>
              ))}
            </div>
          </section>
        )}

        {stats && stats.winStreak > 0 && (
          <div className="frosted-card-sm p-4 rounded-[20px] flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
              Win Streak
            </span>
            <span className="flex items-center gap-1.5 bc-headline text-xl text-accent">
              {stats.winStreak}
              <span className="text-[10px] text-muted-soft font-mono uppercase tracking-wider">🔥</span>
            </span>
          </div>
        )}

        {club && (
          <Link
            href={`/club/${club.slug ?? club.tag ?? club.id}`}
            className="block frosted-card p-5 rounded-[24px] hover:border-accent/20 transition-all duration-300 group"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft mb-3">
              Club
            </p>
            <div className="flex items-center gap-3">
              <div
                className="h-12 w-12 rounded-[14px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center"
                style={{
                  backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined,
                  background: club.logoUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                }}
              >
                {!club.logoUrl && (
                  <span className="bc-headline text-xl text-accent">{club.tag?.[0] ?? club.name[0]}</span>
                )}
              </div>
              <div>
                <p className="bc-headline text-lg text-ink group-hover:text-accent transition-colors duration-300">{club.name}</p>
                <p className="font-mono text-[11px] text-muted-soft">[{club.tag}]</p>
              </div>
            </div>
          </Link>
        )}

        {!club && (
          <div className="frosted-card p-6 rounded-[24px] text-center">
            <p className="font-mono text-[11px] text-muted-soft">Free Agent</p>
          </div>
        )}

        {recentMatches.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
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
                    className="block frosted-card-sm p-3.5 rounded-[18px] hover:border-accent/16 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={
                            "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-[10px] text-[10px] font-bold " +
                            (didWin
                              ? "bg-emerald/10 text-emerald border border-emerald/20"
                              : isDraw
                              ? "bg-gold/10 text-gold border border-gold/16"
                              : "bg-negative/10 text-negative border border-negative/16")
                          }
                        >
                          {didWin ? "W" : isDraw ? "D" : "L"}
                        </span>
                        <span className="text-sm text-ink truncate">
                          vs {opponent.displayName || opponent.username}
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-1.5 font-mono text-sm tabular-nums">
                        <span className={didWin ? "text-accent" : isDraw ? "text-gold" : "text-ink"}>{myScore}</span>
                        <span className="text-muted-faint">:</span>
                        <span className={!didWin && !isDraw ? "text-accent" : "text-ink"}>{oppScore}</span>
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
  variant,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  variant?: "cyan" | "emerald" | "orange";
}) {
  const variantClass = variant === "cyan" ? "glass-cyan" : variant === "emerald" ? "glass-emerald" : variant === "orange" ? "glass-orange" : "";
  return (
    <div className={`${variantClass || "frosted-card-sm"} p-4 sm:p-5 rounded-[22px]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl sm:text-3xl mt-1 tabular-nums " + (accent ? "text-accent" : "text-ink")}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value, accent, negative }: { label: string; value: number | string; accent?: boolean; negative?: boolean }) {
  return (
    <div className="frosted-card-sm p-3 rounded-[16px] text-center">
      <p className={"bc-headline text-lg tabular-nums " + (accent ? "text-accent" : negative ? "text-negative/80" : "text-ink")}>{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-faint mt-0.5">{label}</p>
    </div>
  );
}