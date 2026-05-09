import Link from "next/link";
import { db } from "@/lib/db";

type Tone = "champion" | "runner" | "challenger" | "base";

const TONES: Record<number, Tone> = {
  1: "champion",
  2: "runner",
  3: "challenger",
  4: "base",
  5: "base",
};

type Top5Row = {
  pr_id: string;
  rank_position: number;
  points: number;
  prev_position: number | null;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  club_id: string | null;
  club_name: string | null;
};

export async function Top5Hero() {
  const result = await db.execute(`
    SELECT
      pr.id as pr_id, pr.rank_position, pr.points, pr.prev_position,
      u.id as user_id, u.username, u.display_name, u.avatar_url, u.club_id,
      c.name as club_name
    FROM player_rankings pr
    JOIN users u ON u.id = pr.user_id
    LEFT JOIN clubs c ON c.id = u.club_id
    ORDER BY pr.rank_position ASC
    LIMIT 5
  `);

  const top5 = result.rows as unknown as Top5Row[];

  return (
    <section aria-labelledby="top5-heading" className="relative">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.28em] text-accent uppercase">
            Live · Season 1
          </p>
          <h2
            id="top5-heading"
            className="cinematic-heading mt-1 text-4xl sm:text-6xl text-ink leading-[0.88]"
          >
            Top 5
            <span className="text-gradient-accent">.</span>
          </h2>
        </div>
        <Link
          href="/rankings"
          className="shrink-0 inline-flex items-center gap-1 h-9 px-4 rounded-[14px] text-[10px] font-bold tracking-[0.2em] uppercase text-ink-soft cta-outline"
        >
          Full Rankings
          <span aria-hidden>→</span>
        </Link>
      </div>

      <ol className="space-y-2 sm:space-y-2.5">
        {top5.map((player, i) => {
          const tone = TONES[player.rank_position] ?? "base";
          const t = toneTokens(tone);
          const delta = (player.prev_position ?? player.rank_position) - player.rank_position;

          return (
            <li
              key={player.pr_id}
              className="bc-slide-in-left bc-row-glow group relative isolate overflow-hidden rounded-[20px] transition-all duration-300"
              style={{
                animationDelay: `${i * 80}ms`,
                background: t.bg,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: `1px solid ${t.border}`,
                boxShadow: t.shadow,
                ["--row-glow" as string]: t.glow,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1 sm:w-1.5 rounded-l-[20px] transition-all duration-300 group-hover:w-1.5 sm:group-hover:w-2"
                style={{ background: t.edge }}
              />

              <div className="relative z-10 flex items-stretch gap-3 sm:gap-5 pl-5 sm:pl-7 pr-4 sm:pr-6 py-5 sm:py-6">
                <div className="shrink-0 flex items-center min-w-[64px] sm:min-w-[96px]">
                  <span
                    className="cinematic-heading leading-none tabular-nums text-[72px] sm:text-[110px]"
                    style={{
                      color: t.rankColor,
                      textShadow: t.rankShadow,
                      letterSpacing: "-0.06em",
                    }}
                  >
                    {player.rank_position}
                  </span>
                </div>

                <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3
                      className="cinematic-heading truncate text-3xl sm:text-4xl leading-none text-ink"
                      title={player.username}
                    >
                      {player.display_name || player.username}
                    </h3>
                    {delta !== 0 && (
                      <span
                        className={
                          "shrink-0 inline-flex items-center gap-0.5 text-[10px] font-black tabular-nums " +
                          (delta > 0 ? "text-accent" : "text-negative")
                        }
                        aria-label={delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`}
                      >
                        <span aria-hidden>{delta > 0 ? "▲" : "▼"}</span>
                        {Math.abs(delta)}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-muted-soft">
                    @{player.username}
                    {player.club_name && (
                      <>
                        <span className="mx-2 text-border-strong">•</span>
                        {player.club_name}
                      </>
                    )}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end justify-center text-right">
                  <span
                    className="cinematic-heading tabular-nums leading-none text-3xl sm:text-4xl"
                    style={{ color: t.pointsColor }}
                  >
                    {player.points.toLocaleString()}
                  </span>
                  <span className="mt-1 text-[9px] sm:text-[10px] font-black tracking-[0.28em] uppercase text-muted-faint">
                    Pts
                  </span>
                </div>
              </div>

              {tone === "champion" && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-[0.25em] uppercase pill-gold"
                  style={{
                    boxShadow: "0 4px 14px -4px rgba(255,184,0,0.30)",
                  }}
                >
                  ★ Champion
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function toneTokens(tone: Tone) {
  switch (tone) {
    case "champion":
      return {
        bg: "rgba(22, 24, 29, 0.50)",
        border: "rgba(255,184,0,0.18)",
        edge: "linear-gradient(180deg, #ffd75e 0%, #ffb800 100%)",
        rankColor: "#ffb800",
        rankShadow: "0 0 32px rgba(255,184,0,0.25)",
        pointsColor: "#F0F0F2",
        glow: "rgba(255,184,0,0.22)",
        shadow: "0 8px 32px rgba(255,184,0,0.08), inset 0 1px 0 0 rgba(255,255,255,0.03)",
      };
    case "runner":
      return {
        bg: "rgba(22, 24, 29, 0.50)",
        border: "rgba(0,255,133,0.15)",
        edge: "linear-gradient(180deg, #5cffb0 0%, #00ff85 100%)",
        rankColor: "#00ff85",
        rankShadow: "0 0 28px rgba(0,255,133,0.22)",
        pointsColor: "#F0F0F2",
        glow: "rgba(0,255,133,0.22)",
        shadow: "0 8px 32px rgba(0,255,133,0.06), inset 0 1px 0 0 rgba(255,255,255,0.03)",
      };
    case "challenger":
      return {
        bg: "rgba(22, 24, 29, 0.50)",
        border: "rgba(239,68,68,0.15)",
        edge: "linear-gradient(180deg, #ff8a8a 0%, #ff4d4d 100%)",
        rankColor: "#ff4d4d",
        rankShadow: "0 0 24px rgba(239,68,68,0.22)",
        pointsColor: "#F0F0F2",
        glow: "rgba(239,68,68,0.18)",
        shadow: "0 8px 32px rgba(239,68,68,0.05), inset 0 1px 0 0 rgba(255,255,255,0.03)",
      };
    case "base":
    default:
      return {
        bg: "rgba(22, 24, 29, 0.35)",
        border: "rgba(255,255,255,0.04)",
        edge: "rgba(255,255,255,0.08)",
        rankColor: "rgba(255,255,255,0.12)",
        rankShadow: "none",
        pointsColor: "#F0F0F2",
        glow: "rgba(0,255,133,0.10)",
        shadow: "0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 0 rgba(255,255,255,0.02)",
      };
  }
}