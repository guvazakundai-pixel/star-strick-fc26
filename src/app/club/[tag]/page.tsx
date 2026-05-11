import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const club = await prisma.club.findFirst({
    where: {
      OR: [
        { tag: tag.toUpperCase() },
        { slug: tag.toLowerCase() },
      ],
    },
    select: {
      id: true,
      name: true,
      tag: true,
      slug: true,
      logoUrl: true,
      bannerUrl: true,
      description: true,
      city: true,
      country: true,
      isVerified: true,
      membersInviteOnly: true,
      manager: { select: { id: true, username: true, displayName: true } },
      createdAt: true,
    },
  });

  if (!club) notFound();

  const [memberCount, globalRanking, members, recentMatches] = await Promise.all([
    prisma.clubMember.count({
      where: { clubId: club.id, status: "APPROVED" },
    }),
    prisma.globalClubRanking.findUnique({
      where: { clubId: club.id },
    }),
    prisma.clubMember.findMany({
      where: { clubId: club.id, status: "APPROVED" },
      orderBy: { joinedAt: "asc" },
      take: 20,
      select: {
        id: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    }),
    prisma.matchReport.findMany({
      where: {
        clubId: club.id,
        status: { in: ["CONFIRMED", "APPROVED"] },
      },
      include: {
        player1: { select: { id: true, username: true, displayName: true } },
        player2: { select: { id: true, username: true, displayName: true } },
        winner: { select: { id: true, username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const manager = club.manager;

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="relative overflow-hidden rounded-[28px]" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
          <div
            className="aspect-[16/5] w-full bg-cover bg-center"
            style={{
              backgroundImage: club.bannerUrl
                ? `url(${club.bannerUrl})`
                : "linear-gradient(135deg, #0D0D0F, #16181D 60%, #111214)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/60 to-transparent" />
          <div className="absolute left-5 bottom-5 flex items-end gap-4">
            <div
              className="h-20 w-20 rounded-[18px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center"
              style={{
                backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined,
                boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
                background: club.logoUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
              }}
            >
              {!club.logoUrl && (
                <span className="bc-headline text-3xl text-accent">{club.tag?.[0] ?? club.name[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="bc-headline text-2xl sm:text-3xl text-ink">{club.name}</h1>
                {club.isVerified && (
                  <span className="pill-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Verified</span>
                )}
                {club.membersInviteOnly && (
                  <span className="pill-gold text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Invite Only</span>
                )}
              </div>
              <p className="font-mono text-[11px] text-muted-soft mt-0.5">
                [{club.tag}] · {club.city}, {club.country}
              </p>
            </div>
          </div>
        </div>

        {club.description && (
          <p className="text-sm text-muted leading-relaxed">{club.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Members" value={memberCount} variant="purple" />
          <StatBox label="Global Rank" value={globalRanking ? `#${globalRanking.rankPosition}` : "—"} accent={!!globalRanking} variant="emerald" />
          <StatBox label="Points" value={globalRanking?.totalPoints ?? 0} variant="cyan" />
          <StatBox label="Wins" value={globalRanking?.wins ?? 0} variant="orange" />
        </div>

        {globalRanking && globalRanking.played > 0 && (
          <div className="grid grid-cols-4 gap-2.5">
            <MiniStat label="Played" value={globalRanking.played} />
            <MiniStat label="Draws" value={globalRanking.draws} />
            <MiniStat label="Losses" value={globalRanking.losses} />
            <MiniStat label="GD" value={(globalRanking.goalsFor - globalRanking.goalsAgainst) >= 0 ? `+${globalRanking.goalsFor - globalRanking.goalsAgainst}` : `${globalRanking.goalsFor - globalRanking.goalsAgainst}`} />
          </div>
        )}

        <section className="frosted-card overflow-hidden rounded-[24px]">
          <div className="px-5 py-3.5 border-b border-white/[0.04]">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
              Roster ({memberCount})
            </h2>
          </div>
          <ul className="divide-y divide-white/[0.03]">
            {members.map((m) => (
              <li key={m.id} className="px-5 py-3.5 flex items-center gap-3 transition-colors duration-200 hover:bg-white/[0.02]">
                <div className="h-9 w-9 rounded-[11px] border border-white/[0.05] bg-cover bg-center shrink-0 flex items-center justify-center" style={{ background: "rgba(22,24,28,0.80)" }}>
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt="" className="h-full w-full rounded-[11px] object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-accent">
                      {(m.user.displayName || m.user.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/player/${m.user.username}`}
                    className="text-sm text-ink hover:text-accent transition-colors duration-200 font-medium"
                  >
                    {m.user.displayName || m.user.username}
                  </Link>
                  <p className="font-mono text-[10px] text-muted-soft">@{m.user.username}</p>
                </div>
                <span
                  className={
                    "text-[10px] font-bold uppercase tracking-wider " +
                    (m.role === "MANAGER"
                      ? "text-accent"
                      : m.role === "CAPTAIN"
                      ? "text-gold"
                      : "text-muted-faint")
                  }
                >
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {recentMatches.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
              Recent Matches
            </h2>
            <div className="space-y-2">
              {recentMatches.map((m) => {
                const p1Name = m.player1.displayName || m.player1.username;
                const p2Name = m.player2.displayName || m.player2.username;
                const isP1Win = m.winnerId === m.player1.id;
                const isP2Win = m.winnerId === m.player2.id;
                return (
                  <Link
                    key={m.id}
                    href={`/matches/${m.id}`}
                    className="block frosted-card-sm p-3.5 rounded-[18px] hover:border-accent/16 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${isP1Win ? "text-accent" : "text-ink"}`}>
                        {p1Name}
                      </span>
                      <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
                        <span className={isP1Win ? "text-accent" : "text-ink"}>{m.score1}</span>
                        <span className="text-muted-faint">:</span>
                        <span className={isP2Win ? "text-accent" : "text-ink"}>{m.score2}</span>
                      </div>
                      <span className={`text-xs font-medium ${isP2Win ? "text-accent" : "text-ink"}`}>
                        {p2Name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="text-center font-mono text-[10px] text-muted-faint">
          Founded {club.createdAt.toLocaleDateString()} by{" "}
          <Link
            href={`/player/${manager?.username ?? ""}`}
            className="text-muted-soft hover:text-accent transition-colors duration-200"
          >
            {manager?.displayName ?? manager?.username ?? "Unknown"}
          </Link>
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
  variant?: "cyan" | "emerald" | "orange" | "purple";
}) {
  const variantClass = variant === "cyan" ? "glass-cyan" : variant === "emerald" ? "glass-emerald" : variant === "orange" ? "glass-orange" : variant === "purple" ? "glass-purple" : "";
  return (
    <div className={`${variantClass || "frosted-card-sm"} p-3.5 rounded-[20px]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl mt-1 tabular-nums " + (accent ? "text-accent" : "text-ink")}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="frosted-card-sm p-3 rounded-[16px] text-center">
      <p className="bc-headline text-lg tabular-nums text-ink">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-faint mt-0.5">{label}</p>
    </div>
  );
}