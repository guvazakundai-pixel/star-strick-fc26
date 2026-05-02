import Link from "next/link";
import { PLAYERS, type Player } from "@/lib/players";
import { clubByPlayerId } from "@/lib/clubs";

type Tone = "champion" | "runner" | "challenger" | "base";

const TONES: Record<number, Tone> = {
  1: "champion",
  2: "runner",
  3: "challenger",
  4: "base",
  5: "base",
};

export function Top5Hero() {
  const top5 = PLAYERS.slice(0, 5);

  return (
    <section aria-labelledby="top5-heading" className="relative">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black tracking-[0.28em] text-[#00ff85] uppercase">
            Live · Season 1 · Week 12
          </p>
          <h2
            id="top5-heading"
            className="bc-headline mt-1 text-3xl sm:text-5xl leading-[0.9] text-white"
          >
            Top 5
            <span className="text-[#00ff85]">.</span>
          </h2>
        </div>
        <Link
          href="/rankings"
          className="shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-sm text-[10px] font-black tracking-[0.22em] uppercase text-white/80 ring-1 ring-[#1a1a1a] hover:text-white hover:ring-[#00ff85] transition"
        >
          Full Rankings
          <span aria-hidden>→</span>
        </Link>
      </div>

      <ol className="space-y-2 sm:space-y-2.5">
        {top5.map((p, i) => (
          <Top5Row key={p.id} player={p} index={i} />
        ))}
      </ol>
    </section>
  );
}

function Top5Row({ player, index }: { player: Player; index: number }) {
  const club = clubByPlayerId(player.id);
  const tone = TONES[player.rank] ?? "base";
  const t = toneTokens(tone);
  const delta = player.prev - player.rank;

  return (
    <li
      className="bc-slide-in-left bc-row-glow group relative isolate overflow-hidden rounded-sm border transition-all duration-300"
      style={{
        animationDelay: `${index * 80}ms`,
        background: t.bg,
        borderColor: t.border,
        // CSS var consumed by .bc-row-glow:hover for the neon halo
        ["--row-glow" as string]: t.glow,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1.5 transition-all duration-300 group-hover:w-2"
        style={{ background: t.edge }}
      />

      <div className="relative z-10 flex items-stretch gap-3 sm:gap-5 pl-4 sm:pl-6 pr-3 sm:pr-5 py-4 sm:py-5">
        <div className="shrink-0 flex items-center min-w-[64px] sm:min-w-[96px]">
          <span
            className="bc-headline leading-none tabular-nums text-[68px] sm:text-[104px]"
            style={{
              color: t.rankColor,
              textShadow: t.rankShadow,
              letterSpacing: "-0.06em",
            }}
          >
            {player.rank}
          </span>
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="bc-headline truncate text-2xl sm:text-4xl leading-none text-white"
              title={player.gamertag}
            >
              {player.gamertag}
            </h3>
            {delta !== 0 && (
              <span
                className={
                  "shrink-0 inline-flex items-center gap-0.5 text-[10px] font-black tabular-nums " +
                  (delta > 0 ? "text-[#00ff85]" : "text-[#ff4d4d]")
                }
                aria-label={delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`}
              >
                <span aria-hidden>{delta > 0 ? "▲" : "▼"}</span>
                {Math.abs(delta)}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/60">
            {player.name}
            {club && (
              <>
                <span className="mx-2 text-[#333]">•</span>
                {club.name}
              </>
            )}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end justify-center text-right">
          <span
            className="bc-headline tabular-nums leading-none text-2xl sm:text-4xl"
            style={{ color: t.pointsColor }}
          >
            {player.points.toLocaleString()}
          </span>
          <span className="mt-1 text-[9px] sm:text-[10px] font-black tracking-[0.28em] uppercase text-white/40">
            Pts
          </span>
        </div>
      </div>

      {tone === "champion" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-3 right-4 inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[9px] font-black tracking-[0.25em] uppercase"
          style={{
            background: "#ffb800",
            color: "#0a0a0a",
            boxShadow: "0 6px 18px -6px rgba(255,184,0,0.6)",
          }}
        >
          ★ Champion
        </span>
      )}
    </li>
  );
}

function toneTokens(tone: Tone) {
  switch (tone) {
    case "champion":
      return {
        bg: "linear-gradient(90deg, rgba(255,184,0,0.12) 0%, rgba(10,10,10,0.95) 55%, #0a0a0a 100%)",
        border: "rgba(255,184,0,0.45)",
        edge: "linear-gradient(180deg, #ffd75e 0%, #ffb800 100%)",
        rankColor: "#ffb800",
        rankShadow: "0 0 40px rgba(255,184,0,0.45)",
        pointsColor: "#ffffff",
        glow: "rgba(255,184,0,0.35)",
      };
    case "runner":
      return {
        bg: "linear-gradient(90deg, rgba(0,255,133,0.12) 0%, rgba(10,10,10,0.95) 55%, #0a0a0a 100%)",
        border: "rgba(0,255,133,0.40)",
        edge: "linear-gradient(180deg, #5cffb0 0%, #00ff85 100%)",
        rankColor: "#00ff85",
        rankShadow: "0 0 32px rgba(0,255,133,0.40)",
        pointsColor: "#ffffff",
        glow: "rgba(0,255,133,0.35)",
      };
    case "challenger":
      return {
        bg: "linear-gradient(90deg, rgba(255,77,77,0.12) 0%, rgba(10,10,10,0.95) 55%, #0a0a0a 100%)",
        border: "rgba(255,77,77,0.38)",
        edge: "linear-gradient(180deg, #ff8a8a 0%, #ff4d4d 100%)",
        rankColor: "#ff4d4d",
        rankShadow: "0 0 28px rgba(255,77,77,0.38)",
        pointsColor: "#ffffff",
        glow: "rgba(255,77,77,0.30)",
      };
    case "base":
    default:
      return {
        bg: "linear-gradient(90deg, #0d0d0d 0%, #0a0a0a 60%, #050505 100%)",
        border: "#1a1a1a",
        edge: "#333333",
        rankColor: "rgba(255,255,255,0.18)",
        rankShadow: "none",
        pointsColor: "#ffffff",
        glow: "rgba(0,255,133,0.18)",
      };
  }
}
