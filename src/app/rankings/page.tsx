import { db } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageSkeleton, EmptyState } from "@/components/Skeleton";

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
  matches_played: number;
  goals_scored: number;
  goals_conceded: number;
  skill_rating: number;
};

function getTierTheme(rank: number) {
  if (rank === 1) return {
    tier: "champion",
    cardBg: "from-[#1a1400]/60 via-[#14100a]/70 to-[#0D0D0F]/80",
    cardBorder: "rgba(255,184,0,0.20)",
    cardShadow: "0 16px 64px rgba(255,184,0,0.14), 0 0 100px -20px rgba(255,184,0,0.10), inset 0 1px 0 rgba(255,184,0,0.08)",
    rankColor: "#ffb800",
    rankGlow: "rank-glow-gold",
    pointsColor: "#ffd75e",
    accent: "#ffb800",
    accentBg: "rgba(255,184,0,0.08)",
    accentBorder: "rgba(255,184,0,0.24)",
    gradientLine: "linear-gradient(180deg, #ffd75e 0%, #ffb800 100%)",
    spotlight: "radial-gradient(600px 250px at 25% 50%, rgba(255,184,0,0.10), transparent 65%)",
    badgeBg: "rgba(255,184,0,0.06)",
    badgeBorder: "rgba(255,184,0,0.18)",
  };
  if (rank === 2) return {
    tier: "runner",
    cardBg: "from-[#141418]/55 via-[#121216]/65 to-[#0D0D0F]/80",
    cardBorder: "rgba(200,200,210,0.18)",
    cardShadow: "0 12px 52px rgba(200,200,210,0.08), 0 0 80px -20px rgba(200,200,210,0.06), inset 0 1px 0 rgba(200,200,210,0.06)",
    rankColor: "#E8E8F0",
    rankGlow: "rank-glow-silver",
    pointsColor: "#D6D6E0",
    accent: "#C8C8D2",
    accentBg: "rgba(200,200,210,0.06)",
    accentBorder: "rgba(200,200,210,0.20)",
    gradientLine: "linear-gradient(180deg, #E8E8F0 0%, #C8C8D2 100%)",
    spotlight: "radial-gradient(500px 200px at 25% 50%, rgba(200,200,210,0.06), transparent 60%)",
    badgeBg: "rgba(200,200,210,0.05)",
    badgeBorder: "rgba(200,200,210,0.16)",
  };
  if (rank === 3) return {
    tier: "challenger",
    cardBg: "from-[#161210]/55 via-[#12100e]/65 to-[#0D0D0F]/80",
    cardBorder: "rgba(205,127,50,0.18)",
    cardShadow: "0 12px 52px rgba(205,127,50,0.08), 0 0 80px -20px rgba(205,127,50,0.06), inset 0 1px 0 rgba(205,127,50,0.06)",
    rankColor: "#E8A860",
    rankGlow: "rank-glow-bronze",
    pointsColor: "#E8A860",
    accent: "#CD7F32",
    accentBg: "rgba(205,127,50,0.06)",
    accentBorder: "rgba(205,127,50,0.18)",
    gradientLine: "linear-gradient(180deg, #E8A860 0%, #CD7F32 100%)",
    spotlight: "radial-gradient(500px 200px at 25% 50%, rgba(205,127,50,0.06), transparent 60%)",
    badgeBg: "rgba(205,127,50,0.05)",
    badgeBorder: "rgba(205,127,50,0.16)",
  };
  if (rank <= 10) return {
    tier: "elite",
    cardBg: "from-[rgba(0,255,133,0.03)]/0 via-[rgba(16,18,22,0.50)] to-[rgba(10,12,14,0.60)]",
    cardBorder: "rgba(0,255,133,0.10)",
    cardShadow: "0 8px 40px rgba(0,0,0,0.22), 0 0 60px -16px rgba(0,255,133,0.06), inset 0 1px 0 rgba(0,255,133,0.04)",
    rankColor: "#00ff85",
    rankGlow: "",
    pointsColor: "#00ff85",
    accent: "#00ff85",
    accentBg: "rgba(0,255,133,0.06)",
    accentBorder: "rgba(0,255,133,0.18)",
    gradientLine: "linear-gradient(180deg, #00ff85, #00cc6a)",
    spotlight: "radial-gradient(400px 160px at 20% 50%, rgba(0,255,133,0.04), transparent 55%)",
    badgeBg: "rgba(0,255,133,0.05)",
    badgeBorder: "rgba(0,255,133,0.14)",
  };
  return {
    tier: "pro",
    cardBg: "from-[rgba(18,20,24,0.45)]/0 via-[rgba(16,18,22,0.50)] to-[rgba(10,12,14,0.60)]",
    cardBorder: "rgba(34,211,238,0.08)",
    cardShadow: "0 6px 32px rgba(0,0,0,0.18), 0 0 40px -12px rgba(34,211,238,0.04), inset 0 1px 0 rgba(255,255,255,0.03)",
    rankColor: "#8E909A",
    rankGlow: "",
    pointsColor: "#22d3ee",
    accent: "#22d3ee",
    accentBg: "rgba(34,211,238,0.05)",
    accentBorder: "rgba(34,211,238,0.14)",
    gradientLine: "linear-gradient(180deg, #22d3ee, #3b82f6)",
    spotlight: "radial-gradient(350px 140px at 20% 50%, rgba(34,211,238,0.03), transparent 55%)",
    badgeBg: "rgba(255,255,255,0.03)",
    badgeBorder: "rgba(255,255,255,0.06)",
  };
}

function Top3Card({ player, index }: { player: PlayerRow; index: number }) {
  const t = getTierTheme(player.rank_position);
  const displayName = player.display_name || player.username;
  const winRate = player.matches_played > 0 ? Math.round((player.wins / player.matches_played) * 100) : 0;
  const goalDiff = player.goals_scored - player.goals_conceded;
  const isChampion = player.rank_position === 1;

  return (
    <Link
      href={`/player/${player.username}`}
      className="block group"
    >
      <div
        className={`relative overflow-hidden rounded-[24px] sm:rounded-[28px] transition-all duration-500 group-hover:scale-[1.008]`}
        style={{
          background: `linear-gradient(135deg, ${t.cardBg})`,
          backdropFilter: "blur(28px) saturate(1.4)",
          WebkitBackdropFilter: "blur(28px) saturate(1.4)",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
        }}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: t.spotlight, "--spotlight-max": isChampion ? "0.14" : "0.08" } as React.CSSProperties} />
        {isChampion && (
          <span aria-hidden className="pointer-events-none absolute inset-0 light-streak" />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1 right-4 bc-bg-name select-none"
          style={{
            fontFamily: "var(--font-barlow), system-ui, sans-serif",
            fontSize: isChampion ? "8rem" : "6rem",
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
          className="pointer-events-none absolute inset-y-0 left-0 w-1 sm:w-1.5 rounded-l-[inherit]"
          style={{ background: t.gradientLine }}
        />
        <div className="relative z-10 flex items-stretch gap-4 sm:gap-6 pl-6 sm:pl-8 pr-5 sm:pr-7 py-5 sm:py-7">
          <div className="shrink-0 flex items-center min-w-[56px] sm:min-w-[90px]">
            <span
              className={`cinematic-heading leading-none tabular-nums ${isChampion ? "text-[72px] sm:text-[110px] bc-rank-pulse" : "text-[56px] sm:text-[90px]"} ${t.rankGlow || ""}`}
              style={{ color: t.rankColor, letterSpacing: "-0.06em" }}
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
              {player.rank_change !== 0 && (
                <span className={`shrink-0 inline-flex items-center gap-0.5 font-mono text-[10px] font-black tabular-nums ${player.rank_change > 0 ? "text-accent" : "text-negative/80"}`}>
                  <span aria-hidden>{player.rank_change > 0 ? "▲" : "▼"}</span>
                  {Math.abs(player.rank_change)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[11px] sm:text-xs tracking-wider text-muted-soft">
                @{player.username}
              </span>
              {player.club_tag && (
                <span className="inline-flex items-center rounded-[5px] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
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
                <span className="bc-mono-score text-[11px] text-muted-faint">{winRate}%</span>
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end justify-center text-right">
            <span
              className="cinematic-heading tabular-nums leading-none text-3xl sm:text-5xl bc-mono-score"
              style={{ color: t.pointsColor }}
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
}

function PremiumRowCard({ player, index }: { player: PlayerRow; index: number }) {
  const t = getTierTheme(player.rank_position);
  const displayName = player.display_name || player.username;
  const winRate = player.matches_played > 0 ? Math.round((player.wins / player.matches_played) * 100) : 0;
  const goalDiff = player.goals_scored - player.goals_conceded;
  const isElite = player.rank_position <= 10;

  return (
    <Link
      href={`/player/${player.username}`}
      className="block group bc-scoreboard-enter"
      style={{ animationDelay: `${(index + 3) * 40}ms` }}
    >
      <div
        className={`relative overflow-hidden rounded-[20px] sm:rounded-[22px] transition-all duration-400 bc-row-glow group-hover:scale-[1.006]`}
        style={{
          background: isElite
            ? "linear-gradient(135deg, rgba(0,255,133,0.03) 0%, rgba(16,18,22,0.55) 40%, rgba(10,12,14,0.65) 100%)"
            : "linear-gradient(135deg, rgba(18,20,24,0.45) 0%, rgba(16,18,22,0.50) 40%, rgba(10,12,14,0.60) 100%)",
          backdropFilter: "blur(16px) saturate(1.4)",
          WebkitBackdropFilter: "blur(16px) saturate(1.4)",
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.cardShadow,
          ["--row-glow" as string]: `rgba(${isElite ? "0,255,133" : "34,211,238"},0.12)`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] rounded-l-[inherit]"
          style={{ background: t.gradientLine }}
        />
        {isElite && (
          <span aria-hidden className="pointer-events-none absolute inset-0 bc-spotlight" style={{ background: t.spotlight, "--spotlight-max": "0.06" } as React.CSSProperties} />
        )}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-3 select-none"
          style={{
            fontFamily: "var(--font-barlow), system-ui, sans-serif",
            fontSize: "3.5rem",
            fontWeight: 900,
            fontStyle: "italic",
            lineHeight: 1,
            letterSpacing: "-0.06em",
            color: "rgba(255,255,255,0.02)",
          }}
        >
          {displayName.slice(0, 6).toUpperCase()}
        </span>

        <div className="relative z-10 flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
          <div className="w-10 sm:w-12 text-center shrink-0">
            <span
              className="bc-headline tabular-nums text-xl sm:text-2xl leading-none"
              style={{ color: t.rankColor }}
            >
              {player.rank_position}
            </span>
          </div>

          <div
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-[14px] border shrink-0 flex items-center justify-center bg-cover bg-center overflow-hidden"
            style={{
              borderColor: isElite ? "rgba(0,255,133,0.14)" : "rgba(255,255,255,0.05)",
              boxShadow: player.avatar_url ? "0 4px 16px rgba(0,0,0,0.2)" : "none",
              background: player.avatar_url ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
              ...(player.avatar_url ? { backgroundImage: `url(${player.avatar_url})` } : {}),
            }}
          >
            {!player.avatar_url && (
              <span className="text-[12px] font-bold text-accent">{displayName[0]}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm sm:text-[15px] font-semibold text-ink group-hover:text-accent transition-colors duration-300 truncate">
                {displayName}
              </p>
              {player.win_streak >= 3 && (
                <span className="shrink-0 text-[9px]">🔥</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[10px] tracking-wider text-muted-soft">@{player.username}</span>
              {player.club_tag && (
                <span className="inline-flex items-center rounded-[4px] px-1 py-px text-[9px] font-bold uppercase tracking-wider" style={{ background: t.badgeBg, border: `1px solid ${t.badgeBorder}` }}>
                  {player.club_tag}
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2.5 bc-mono-score text-[10px] text-muted-soft shrink-0">
            <span className="text-emerald">{player.wins}<span className="text-muted-faint">W</span></span>
            <span>{player.draws}<span className="text-muted-faint">D</span></span>
            <span className="text-negative/70">{player.losses}<span className="text-muted-faint">L</span></span>
            <span className="text-muted-faint">{winRate}%</span>
          </div>

          <div className="text-right shrink-0 pl-2">
            <p
              className="bc-mono-score text-base sm:text-lg tabular-nums font-bold"
              style={{ color: t.pointsColor }}
            >
              {player.points.toLocaleString()}
            </p>
            {player.rank_change !== 0 && (
              <p className={`font-mono text-[10px] tabular-nums ${player.rank_change > 0 ? "text-accent" : "text-negative/80"}`}>
                {player.rank_change > 0 ? "▲" : "▼"} {Math.abs(player.rank_change)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function RankingsGrid({ players }: { players: PlayerRow[] }) {
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <>
      {top3.length > 0 && (
        <section className="space-y-3 sm:space-y-4">
          {top3.map((player, idx) => (
            <Top3Card key={player.pr_id} player={player} index={idx} />
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-4 sm:mt-6">
          <div className="mb-3 sm:mb-4 flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-muted-faint">Rank 4+</span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {rest.map((player, idx) => (
              <PremiumRowCard key={player.pr_id} player={player} index={idx} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default async function RankingsPage() {
  let players: PlayerRow[] = [];
  let error: string | null = null;

  try {
    const result = await db.execute(`
      SELECT
        pr.id as pr_id, pr.rank_position, pr.points, pr.rank_change, pr.final_score,
        u.id as user_id, u.username, u.display_name, u.avatar_url, u.platform, u.club_id,
        c.name as club_name, c.tag as club_tag,
        ps.wins, ps.draws, ps.losses, ps.win_streak,
        ps.matches_played, ps.goals_scored, ps.goals_conceded, ps.skill_rating
      FROM player_rankings pr
      JOIN users u ON u.id = pr.user_id
      LEFT JOIN clubs c ON c.id = u.club_id
      LEFT JOIN player_stats ps ON ps.user_id = u.id
      ORDER BY pr.rank_position ASC
      LIMIT 50
    `);
    players = result.rows as unknown as PlayerRow[];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load rankings";
  }

  if (error) {
    return (
      <div className="broadcast-theme min-h-screen">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(255,77,77,0.06)", border: "1px solid rgba(255,77,77,0.12)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-negative/70"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
            </div>
            <h2 className="bc-headline text-2xl text-ink">Failed to load rankings</h2>
            <p className="text-sm text-muted max-w-xs mx-auto">{error}</p>
            <button onClick={() => typeof window !== "undefined" && window.location.reload()} className="rounded-[14px] cta-primary px-6 py-2.5 text-sm font-bold text-[#0D0D0F]">Retry</button>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-soft">
                <span className="h-2.5 w-2.5 rounded-full bg-accent/30" />
                Elite
              </div>
            </div>
          </header>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-28">
        <ErrorBoundary>
          {players.length === 0 ? (
            <EmptyState
              title="No rankings yet"
              description="Sign up and compete to appear on the leaderboard!"
              action={
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-12 rounded-[18px] cta-primary px-7 bc-headline text-base tracking-[0.14em] text-[#0D0D0F]"
                >
                  Enter Rankings
                </Link>
              }
            />
          ) : (
            <RankingsGrid players={players} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}