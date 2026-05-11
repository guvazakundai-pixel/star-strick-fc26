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
      isBanned: true, createdAt: true,
    },
  });
  if (!user) redirect("/login");

  const [playerRanking, playerStats, club, pointsLogs] = await Promise.all([
    prisma.playerRanking.findUnique({ where: { userId: user.id } }),
    prisma.playerStats.findUnique({ where: { userId: user.id } }),
    user.clubId ? prisma.club.findUnique({ where: { id: user.clubId }, select: { id: true, name: true, slug: true, tag: true, logoUrl: true } }) : Promise.resolve(null),
    prisma.pointsLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, pointsChange: true, reason: true, createdAt: true } }),
  ]);

  const isAdmin = session.role === "ADMIN" || session.role === "MANAGER";

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Player Dashboard</p>
            <h1 className="bc-headline text-3xl text-ink mt-0.5">{user.displayName || user.username}</h1>
            <p className="font-mono text-[11px] text-muted-soft mt-0.5">@{user.username} · {user.platform} · {user.country}</p>
          </div>
          {isAdmin && (
            <Link href="/admin" className="rounded-[12px] pill-accent px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-accent/12 transition-all duration-200">Admin Panel</Link>
          )}
        </header>

        {user.isBanned && (
          <div className="rounded-[16px] border border-negative/25 bg-negative/6 px-4 py-3 text-sm text-negative/90" style={{ background: "rgba(255,51,51,0.06)" }}>
            Your account has been suspended.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Rank" value={playerRanking ? `#${playerRanking.rankPosition}` : "—"} variant="cyan" />
          <StatCard label="Points" value={playerRanking?.points ?? playerStats?.points ?? 0} accent variant="emerald" />
          <StatCard label="Win Rate" value={playerStats && playerStats.matchesPlayed > 0 ? `${Math.round((playerStats.wins / playerStats.matchesPlayed) * 100)}%` : "—"} variant="orange" />
          <StatCard label="Streak" value={playerStats?.winStreak ?? 0} />
        </div>

        <section className="frosted-card overflow-hidden rounded-[24px]">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Club</h2>
          </div>
          <div className="p-5">
            {club ? (
              <Link href={`/club/${club.slug}`} className="flex items-center gap-3.5 group">
                <div
                  className="h-12 w-12 rounded-[14px] border border-white/[0.06] bg-cover bg-center shrink-0"
                  style={{
                    backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined,
                    background: club.logoUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
                  }}
                />
                <div>
                  <p className="bc-headline text-lg text-ink group-hover:text-accent transition-colors duration-300">{club.name}</p>
                  <p className="font-mono text-[11px] text-muted-soft">[{club.tag}]</p>
                </div>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted text-sm">You are a free agent</p>
              </div>
            )}
          </div>
        </section>

        <section className="frosted-card overflow-hidden rounded-[24px]">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Recent Points</h2>
          </div>
          {pointsLogs.length === 0 ? (
            <div className="p-5 text-center text-sm text-muted">No points yet.</div>
          ) : (
            <ul className="divide-y divide-white/[0.03]">
              {pointsLogs.map((pe) => (
                <li key={pe.id} className="px-5 py-3.5 flex items-center justify-between transition-colors duration-200 hover:bg-white/[0.02]">
                  <span className="text-sm text-ink">{pe.reason}</span>
                  <span className={"font-mono text-sm font-bold " + (pe.pointsChange >= 0 ? "text-accent" : "text-negative/90")}>{pe.pointsChange >= 0 ? "+" : ""}{pe.pointsChange}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="text-center">
          <Link href="/dashboard/edit-profile" className="text-[10px] font-bold uppercase tracking-wider text-accent hover:underline">Edit Profile</Link>
          <span className="text-muted-faint mx-2">·</span>
          <a href="/api/auth/logout" className="text-[10px] font-bold uppercase tracking-wider text-muted-soft hover:text-negative/90 transition-colors duration-200">Sign Out</a>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, variant }: { label: string; value: string | number; accent?: boolean; variant?: "cyan" | "emerald" | "orange" | "purple" }) {
  const variantClass = variant === "cyan" ? "glass-cyan" : variant === "emerald" ? "glass-emerald" : variant === "orange" ? "glass-orange" : variant === "purple" ? "glass-purple" : "";
  return (
    <div className={`${variantClass || "frosted-card-sm"} p-3.5 rounded-[20px]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl mt-1 tabular-nums " + (accent ? "text-accent" : "text-ink")}>{value}</p>
    </div>
  );
}