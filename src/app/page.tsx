import Link from "next/link";
import { PLAYERS } from "@/lib/players";
import { Top5Hero } from "@/components/Top5Hero";
import { AuthModalCTA } from "@/components/AuthModalCTA";

export default function HomePage() {
  const totalMatches = PLAYERS.reduce(
    (sum, p) => sum + p.wins + p.losses + p.draws,
    0,
  );
  const totalGoals = PLAYERS.reduce((sum, p) => sum + p.goalsFor, 0);
  const totalPrize = PLAYERS.reduce((sum, p) => sum + p.prizeMoney, 0);

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10 space-y-10">
        <Hero />
        <section className="grid grid-cols-3 gap-2 sm:gap-3">
          <KpiCard label="Matches" value={totalMatches.toLocaleString()} delta="+34 today" tone="neon" />
          <KpiCard label="Goals" value={totalGoals.toLocaleString()} delta="+118 today" tone="gold" />
          <KpiCard label="Prize Pool" value={`$${(totalPrize / 1000).toFixed(1)}k`} delta="+$420 wk" tone="neon" />
        </section>
        <Top5Hero />
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/rankings" className="inline-flex items-center justify-center h-11 rounded-sm bg-[#00ff85] px-5 bc-headline text-base tracking-[0.15em] text-[#050505] hover:bg-white transition">View Rankings</Link>
          <AuthModalCTA tab="join" className="inline-flex items-center justify-center h-11 rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] px-5 bc-headline text-base tracking-[0.15em] text-white hover:border-[#00ff85] hover:text-[#00ff85] transition">Enter Rankings</AuthModalCTA>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-6 sm:p-10">
      <div aria-hidden className="absolute inset-0 opacity-60 pointer-events-none" style={{ background: "radial-gradient(600px 240px at 80% -10%, rgba(0,255,133,0.18), transparent 60%), radial-gradient(420px 220px at 0% 110%, rgba(255,184,0,0.10), transparent 60%)" }} />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#00ff85]/40 bg-[#00ff85]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#00ff85]">
          <span className="bc-pulse-cta h-1.5 w-1.5 rounded-full bg-[#00ff85]" />
          Season 1 · Week 12 · Live
        </span>
        <h1 className="bc-headline mt-4 text-4xl sm:text-6xl leading-[0.9] text-white">
          Zimbabwe&apos;s<br />Pro <span className="text-[#00ff85]">EA FC</span> League
        </h1>
        <p className="mt-4 max-w-xl text-sm sm:text-base text-white/60">
          Track every win, every goal, every challenger from Harare to Vic Falls. Star Strick FC26 is the home of Zim&apos;s competitive scene.
        </p>
      </div>
    </section>
  );
}

function KpiCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "neon" | "gold" }) {
  const valueColor = tone === "neon" ? "#00ff85" : "#ffb800";
  return (
    <div className="rounded-sm border border-[#1a1a1a] bg-[#0a0a0a] p-3 sm:p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">{label}</p>
      <p className="bc-headline mt-1 text-2xl sm:text-3xl tabular-nums leading-none" style={{ color: valueColor }}>{value}</p>
      <p className="mt-1.5 font-mono text-[10px] text-white/40"><span className="text-[#00ff85]">▲</span> {delta}</p>
    </div>
  );
}
