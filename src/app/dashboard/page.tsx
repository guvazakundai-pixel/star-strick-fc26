import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlayerDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, username: true, displayName: true, email: true, role: true,
      platform: true, country: true, bio: true, avatarUrl: true, clubId: true,
      isBanned: true, emailVerified: true, createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const [playerRanking, playerStats, club, pointEvents] = await Promise.all([
    prisma.playerRanking.findUnique({ where: { userId: user.id } }),
    prisma.playerStats.findUnique({ where: { userId: user.id } }),
    user.clubId ? prisma.club.findUnique({ where: { id: user.clubId }, select: { id: true, name: true, tag: true, logoUrl: true } }) : Promise.resolve(null),
    prisma.pointEvent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, points: true, reason: true, createdAt: true } }),
  ]);

  const isAdmin = session.role === "ADMIN" || session.role === "MANAGER";

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a9a]">Player Dashboard</p>
            <h1 className="bc-headline text-3xl text-white">{user.displayName || user.username}</h1>
            <p className="font-mono text-[11px] text-[#9a9a9a] mt-0.5">@{user.username} · {user.platform} · {user.country}</p>
          </div>
          {isAdmin && (
            <Link href="/admin" className="rounded border border-[#333] bg-[#00ff85]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#00ff85] hover:bg-[#00ff85]/20 transition">Admin Panel</Link>
          )}
        </header>
        {user.isBanned && (
          <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">Your account has been suspended.</div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">Rank</p>
            <p className="bc-headline text-2xl text-white mt-1">{playerRanking ? `#${playerRanking.rankPosition}` : "—"}</p>
          </div>
          <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">Points</p>
            <p className="bc-headline text-2xl text-[#00ff85] mt-1">{playerRanking?.points ?? playerStats?.points ?? 0}</p>
          </div>
          <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">Win Rate</p>
            <p className="bc-headline text-2xl text-white mt-1">{playerStats && playerStats.matchesPlayed > 0 ? `${Math.round((playerStats.wins / playerStats.matchesPlayed) * 100)}%` : "—"}</p>
          </div>
          <div className="rounded-lg border border-[#333] bg-[#1a1a1a]/50 p-3">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">Streak</p>
            <p className="bc-headline text-2xl text-white mt-1">{playerStats?.winStreak ?? 0}</p>
          </div>
        </div>
        <section className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333]"><h2 className="font-mono text-[11px] uppercase tracking-wider text-[#9a9a9a]">Club</h2></div>
          <div className="p-4">
            {club ? (
              <Link href={`/club/${club.tag}`} className="flex items-center gap-3 group">
                <div className="h-12 w-12 rounded-lg border border-[#333] bg-black bg-cover bg-center shrink-0" style={{ backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined }} />
                <div>
                  <p className="bc-headline text-lg text-white group-hover:text-[#00ff85] transition-colors">{club.name}</p>
                  <p className="font-mono text-[11px] text-[#9a9a9a]">[{club.tag}]</p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#9a9a9a] text-sm">You are a free agent</p>
              </div>
            )}
          </div>
        </section>
        <section className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333]"><h2 className="font-mono text-[11px] uppercase tracking-wider text-[#9a9a9a]">Recent Points</h2></div>
          {pointEvents.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#9a9a9a]">No points yet.</div>
          ) : (
            <ul className="divide-y divide-[#333]">
              {pointEvents.map((pe) => (
                <li key={pe.id} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-white">{pe.reason}</span>
                  <span className={"font-mono text-sm font-bold " + (pe.points >= 0 ? "text-[#00ff85]" : "text-red-400")}>{pe.points >= 0 ? "+" : ""}{pe.points}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="text-center">
          <Link href="/dashboard/edit-profile" className="text-[10px] font-bold uppercase tracking-wider text-[#00ff85] hover:underline">Edit Profile</Link>
          <span className="text-[#666] mx-2">·</span>
          <a href="/api/auth/logout" className="text-[10px] font-bold uppercase tracking-wider text-[#9a9a9a] hover:text-red-400">Sign Out</a>
        </div>
      </div>
    </div>
  );
}
