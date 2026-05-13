import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";

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

function getMedalTone(pos: number) {
  if (pos === 1) return {
    cardClass: "bc-row-card-gold",
    rankText: "text-gradient-gold rank-glow-gold",
    pointsColor: "#ffb800",
    spotlightColor: "rgba(255,184,0,0.08)",
    spotlightMax: "0.14",
    bgLabel: "rgba(255,184,0,0.06)",
    borderPill: "rgba(255,184,0,0.24)",
    changeColor: "text-gold",
    avatarShadow: "0 0 24px rgba(255,184,0,0.22), 0 0 6px rgba(255,184,0,0.10)",
  };
  if (pos === 2) return {
    cardClass: "bc-row-card-silver",
    rankText: "text-[#C8C8D2] rank-glow-silver",
    pointsColor: "#D6D6E0",
    spotlightColor: "rgba(200,200,210,0.06)",
    spotlightMax: "0.10",
    bgLabel: "rgba(200,200,210,0.05)",
    borderPill: "rgba(200,200,210,0.20)",
    changeColor: "text-silver",
    avatarShadow: "0 0 18px rgba(200,200,210,0.16)",
  };
  if (pos === 3) return {
    cardClass: "bc-row-card-bronze",
    rankText: "text-[#CD7F32] rank-glow-bronze",
    pointsColor: "#E8A860",
    spotlightColor: "rgba(205,127,50,0.06)",
    spotlightMax: "0.10",
    bgLabel: "rgba(205,127,50,0.05)",
    borderPill: "rgba(205,127,50,0.18)",
    changeColor: "text-bronze",
    avatarShadow: "0 0 18px rgba(205,127,50,0.16)",
  };
  return {
    cardClass: "bc-row-card",
    rankText: "text-muted-faint",
    pointsColor: "#00ff85",
    spotlightColor: "rgba(34,211,238,0.03)",
    spotlightMax: "0.06",
    bgLabel: "rgba(255,255,255,0.03)",
    borderPill: "rgba(255,255,255,0.06)",
    changeColor: "text-accent",
    avatarShadow: "none",
  };
}

function RankingsGrid({ players }: { players: PlayerRow[] }) {
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <>
      {top3.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          {top3.map((player, idx) => {
            const tone = getMedalTone(player.rank_position);
            const change = player.rank_change;
            const isChampion = player.rank_position === 1;
            const displayName = player.display_name || player.username;

            return (
              <Link
                key={player.pr_id}
                href={`/player/${player.username}`}
                className="block group bc-scoreboard-enter"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div
                  className={`relative overflow-hidden rounded-[24px] sm:rounded-[28px] transition-all duration-400 ${tone.cardClass}`}
                  style={{
                    boxShadow: isChampion
                      ? "0 12px 48px rgba(255,184,0,0.12), 0 0 80px -20px rgba(255,184,0,0.14), inset 0 1px 0 rgba(255,255,255,0.06)"
                      : player.rank_position === 2
                        ? "0 8px 40px rgba(200,200,210,0.08), inset 0 1px 0 rgba(255,255,255,0.05)"
                        : "0 8px 40px rgba(205,127,50,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {isChampion && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bc-spotlight"
                      style={{
                        background: `radial-gradient(600px 200px at 20% 50%, ${tone.spotlightColor}, transparent 60%)`,
                        "--spotlight-max": tone.spotlightMax,
                      } as React.CSSProperties}
                    />
                  )}
                  {!isChampion && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(400px 160px at 15% 50%, ${tone.spotlightColor}, transparent 55%)`,
                      }}
                    />
                  )}

                  <span
                    aria-hidden
                    className="pointer-events-none absolute bottom-1 right-4 bc-bg-name select-none"
                    style={{
                      fontFamily: "var(--font-barlow), system-ui, sans-serif",
                      fontSize: "6rem",
                      fontWeight: 900,
                      fontStyle: "italic",
                      lineHeight: 1,
                      letterSpacing: "-0.06em",
                      color: isChampion ? "rgba(255,184,0,0.06)" : "rgba(255,255,255,0.04)",
                      "--name-opacity": isChampion ? "0.08" : "0.05",
                    } as React.CSSProperties}
                  >
                    {displayName.slice(0, 8).toUpperCase()}
                  </span>

                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-0 w-1 sm:w-1.5 rounded-l-[inherit] transition-all duration-400"
                    style={{
                      background: isChampion
                        ? "linear-gradient(180deg, #ffd75e 0%, #ffb800 100%)"
                        : player.rank_position === 2
                          ? "linear-gradient(180deg, #E8E8F0 0%, #C8C8D2 100%)"
                          : "linear-gradient(180deg, #E8A860 0%, #CD7F32 100%)",
                    }}
                  />

                  <div className="relative z-10 flex items-stretch gap-4 sm:gap-6 pl-6 sm:pl-8 pr-5 sm:pr-7 py-5 sm:py-7">
                    <div className="shrink-0 flex items-center min-w-[56px] sm:min-w-[90px]">
                      <span
                        className={`cinematic-heading leading-none tabular-nums ${
                          isChampion ? "text-[72px] sm:text-[110px] bc-rank-pulse" : "text-[56px] sm:text-[90px]"
                        } ${tone.rankText}`}
                        style={{ letterSpacing: "-0.06em" }}
                      >
                        {player.rank_position}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-center gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="cinematic-heading truncate text-2xl sm:text-4xl leading-none text-ink group-hover:text-accent transition-colors duration-300">
                          {displayName}
                        </h3>
                        {isChampion && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-[0.2em] uppercase pill-gold" style={{ boxShadow: "0 4px 18px -4px rgba(255,184,0,0.35)" }}>
                            ★ Champion
                          </span>
                        )}
                        {change !== 0 && (
                          <span
                            className={`shrink-0 inline-flex items-center gap-0.5 font-mono text-[10px] font-black tabular-nums ${change > 0 ? "text-accent" : "text-negative/80"}`}
                          >
                            <span aria-hidden>{change > 0 ? "▲" : "▼"}</span>
                            {Math.abs(change)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] sm:text-xs tracking-wider text-muted-soft">
                          @{player.username}
                        </span>
                        {player.club_tag && (
                          <span className="inline-flex items-center rounded-[5px] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider" style={{ background: tone.bgLabel, border: `1px solid ${tone.borderPill}` }}>
                            <span className="text-accent/70 mr-1">⚑</span>{player.club_tag}
                          </span>
                        )}
                        {player.platform && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-faint">{player.platform}</span>
                        )}
                      </div>
                      {player.wins != null && (
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="bc-mono-score text-[11px] text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
                          <span className="bc-mono-score text-[11px] text-muted-soft">{player.draws}<span className="text-muted-faint">D</span></span>
                          <span className="bc-mono-score text-[11px] text-negative/70">{player.losses}<span className="text-muted-faint">L</span></span>
                          {player.win_streak > 2 && (
                            <span className="bc-mono-score text-[11px] text-accent">🔥{player.win_streak}</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col items-end justify-center text-right">
                      <span
                        className="cinematic-heading tabular-nums leading-none text-3xl sm:text-5xl bc-mono-score"
                        style={{ color: tone.pointsColor }}
                      >
                        {player.points.toLocaleString()}
                      </span>
                      <span className="mt-1.5 text-[9px] font-black tracking-[0.28em] uppercase text-muted-faint">
                        PTS
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-4 sm:mt-6">
          <div className="mb-3 sm:mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-faint">Rank 4–50</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {rest.map((player, idx) => {
              const tone = getMedalTone(player.rank_position);
              const change = player.rank_change;

              return (
                <Link
                  key={player.pr_id}
                  href={`/player/${player.username}`}
                  className="block group bc-scoreboard-enter"
                  style={{ animationDelay: `${(idx + 3) * 40}ms` }}
                >
                  <div
                    className="relative overflow-hidden rounded-[18px] sm:rounded-[20px] p-3.5 sm:p-4 transition-all duration-300 bc-row-card bc-row-glow"
                    style={{
                      ["--row-glow" as string]: "rgba(0,255,133,0.10)",
                      ["--row-border-from" as string]: "rgba(34,211,238,0.10)",
                      ["--row-border-to" as string]: "rgba(0,255,133,0.06)",
                    }}
                  >
                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                      <div className="w-9 sm:w-11 text-center shrink-0">
                        <span className={`bc-headline tabular-nums text-xl sm:text-2xl ${tone.rankText}`}>
                          {player.rank_position}
                        </span>
                      </div>

                      <div
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-[12px] border border-border-faint shrink-0 flex items-center justify-center bg-cover bg-center overflow-hidden"
                        style={{
                          backgroundImage: player.avatar_url ? `url(${player.avatar_url})` : undefined,
                          boxShadow: "none",
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] tracking-wider text-muted-soft">@{player.username}</span>
                          {player.club_tag && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-accent/50">[{player.club_tag}]</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="bc-mono-score text-base sm:text-lg text-accent tabular-nums font-bold">
                          {player.points.toLocaleString()}
                        </p>
                        {change !== 0 && (
                          <p className={`font-mono text-[10px] tabular-nums ${change > 0 ? "text-accent" : "text-negative/80"}`}>
                            {change > 0 ? "▲" : "▼"} {Math.abs(change)}
                          </p>
                        )}
                      </div>

                      {player.wins != null && (
                        <div className="hidden sm:flex items-center gap-2 bc-mono-score text-[10px] text-muted-soft shrink-0">
                          <span className="text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
                          <span>{player.draws}<span className="text-muted-faint">D</span></span>
                          <span className="text-negative/70">{player.losses}<span className="text-muted-faint">L</span></span>
                          {player.win_streak > 2 && (
                            <span className="text-accent">🔥{player.win_streak}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function RankingsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bc-skeleton-card p-5 sm:p-7 flex items-stretch gap-4 sm:gap-6">
          <div className="bc-skeleton w-[56px] sm:w-[90px] h-16 sm:h-24" />
          <div className="flex-1 space-y-2.5 py-2">
            <div className="bc-skeleton h-5 w-3/5 rounded-lg" />
            <div className="bc-skeleton h-3 w-2/5 rounded-lg" />
          </div>
          <div className="bc-skeleton w-16 h-10 self-center rounded-lg" />
        </div>
      ))}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bc-skeleton" />
        <div className="bc-skeleton h-3 w-24 rounded" />
        <div className="h-px flex-1 bc-skeleton" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={`rest-${i}`} className="bc-skeleton-card p-3.5 sm:p-4 flex items-center gap-3">
          <div className="bc-skeleton w-9 h-5 rounded" />
          <div className="bc-skeleton w-10 h-10 rounded-[12px]" />
          <div className="flex-1 space-y-2">
            <div className="bc-skeleton h-4 w-2/5 rounded" />
            <div className="bc-skeleton h-3 w-3/5 rounded" />
          </div>
          <div className="bc-skeleton w-14 h-5 rounded" />
        </div>
      ))}
    </div>
  );
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
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(700px 300px at 50% -5%, rgba(0,255,133,0.07) 0%, rgba(34,211,238,0.04) 40%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #0a0a0c 0%, #000000 100%)",
            opacity: 0.4,
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
          <header className="bc-scoreboard-enter" style={{ animationDelay: "0ms" }}>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-accent/20 px-4 py-1.5 mb-5" style={{ background: "rgba(0,255,133,0.05)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-accent bc-live-dot" style={{ boxShadow: "0 0 8px rgba(0,255,133,0.60)" }} />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-accent">Live · Season 1</span>
            </div>
            <h1 className="cinematic-heading text-[3.5rem] sm:text-8xl md:text-9xl text-ink leading-[0.82]">
             PLAYER<br />
              <span className="text-gradient-championship">Rankings</span>
            </h1>
            <p className="mt-4 text-sm sm:text-[15px] text-muted max-w-lg leading-relaxed">
              Zimbabwe&apos;s elite EA FC players — ranked by skill, wins, and consistency.
            </p>

            <div className="mt-5 flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #ffd75e, #ffb800)" }} />
                Gold
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #E8E8F0, #C8C8D2)" }} />
                Silver
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "linear-gradient(135deg, #E8A860, #CD7F32)" }} />
                Bronze
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-28">
        <Suspense fallback={<RankingsSkeleton />}>
          {players.length === 0 ? (
            <div className="glass p-12 text-center space-y-4">
              <p className="cinematic-heading text-4xl text-ink">No rankings yet</p>
              <p className="text-sm text-muted leading-relaxed">
                Sign up and compete to appear on the leaderboard!
              </p>
              <div className="flex justify-center gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-7 bc-headline text-base tracking-[0.14em] text-[#0D0D0F]"
                >
                  Enter Rankings
                </Link>
              </div>
            </div>
          ) : (
            <RankingsGrid players={players} />
          )}
        </Suspense>
      </div>
    </div>
  );
}