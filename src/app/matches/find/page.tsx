import Link from "next/link";
import { AuthModalCTA } from "@/components/AuthModalCTA";

export default function MatchesFindPage() {
  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">
            Competitive Play
          </p>
          <h1 className="bc-headline mt-1 text-3xl sm:text-5xl text-white">
            Find a Match
          </h1>
          <p className="mt-1 text-sm text-[#9a9a9a]">
            Challenge opponents, report results, and climb the rankings
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg border border-[#00ff85]/30 bg-[#00ff85]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00ff85" strokeWidth={2} className="h-6 w-6">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-5" />
              </svg>
            </div>
            <h2 className="bc-headline text-xl text-white">Quick Match</h2>
            <p className="text-sm text-[#9a9a9a]">
              Jump into a match with the next available opponent at your skill level.
            </p>
            <AuthModalCTA tab="join" className="inline-flex items-center justify-center h-10 rounded-sm bg-[#00ff85] px-4 text-sm font-bold tracking-wider text-[#050505] hover:bg-white transition">
              Find Opponent
            </AuthModalCTA>
          </div>

          <div className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-6 space-y-4">
            <div className="h-12 w-12 rounded-lg border border-[#ffb800]/30 bg-[#ffb800]/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffb800" strokeWidth={2} className="h-6 w-6">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="bc-headline text-xl text-white">Challenge a Player</h2>
            <p className="text-sm text-[#9a9a9a]">
              Search for a specific opponent and send them a challenge request.
            </p>
            <AuthModalCTA tab="join" className="inline-flex items-center justify-center h-10 rounded-sm border border-[#ffb800] px-4 text-sm font-bold tracking-wider text-[#ffb800] hover:bg-[#ffb800]/10 transition">
              Challenge
            </AuthModalCTA>
          </div>
        </div>

        <div className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 p-6 text-center space-y-3">
          <h3 className="bc-headline text-lg text-white">Match System Coming Soon</h3>
          <p className="text-sm text-[#9a9a9a]">
            Full match reporting, result verification, and dispute resolution are under development.
            Join now to be ready when the competitive season launches.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/rankings" className="text-sm text-[#00ff85] hover:text-white transition">View Rankings →</Link>
            <Link href="/clubs" className="text-sm text-[#ffb800] hover:text-white transition">Browse Clubs →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}