import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { EmptyState } from "@/components/Skeleton";

export const dynamic = "force-dynamic";

export default async function ClubProfilePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;

  let club;
  try {
    club = await prisma.club.findFirst({
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
  } catch {
    notFound();
  }

  if (!club) notFound();

  let memberCount = 0;
  let globalRanking = null;
  let members: any[] = [];
  let recentMatches: any[] = [];

  try {
    [memberCount, globalRanking, members, recentMatches] = await Promise.all([
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
  } catch {}

  const manager = club.manager;

  return (
    <div className="broadcast-theme min-h-screen bc-grain">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <ErrorBoundary>
          <ClubHeader
            name={club.name}
            tag={club.tag}
            slug={club.slug}
            logoUrl={club.logoUrl}
            bannerUrl={club.bannerUrl}
            isVerified={club.isVerified}
            membersInviteOnly={club.membersInviteOnly}
            city={club.city}
            country={club.country}
            description={club.description}
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Members" value={memberCount} variant="purple" />
            <StatCard label="Global Rank" value={globalRanking ? `#${globalRanking.rankPosition}` : "—"} accent={!!globalRanking} variant="emerald" />
            <StatCard label="Points" value={globalRanking?.totalPoints ?? 0} variant="cyan" />
            <StatCard label="Wins" value={globalRanking?.wins ?? 0} variant="orange" />
          </div>

          {globalRanking && globalRanking.played > 0 && (
            <div className="grid grid-cols-4 gap-2.5">
              <MiniStat label="Played" value={globalRanking.played} />
              <MiniStat label="Draws" value={globalRanking.draws} />
              <MiniStat label="Losses" value={globalRanking.losses} />
              <MiniStat label="GD" value={globalRanking.goalsFor - globalRanking.goalsAgainst >= 0 ? `+${globalRanking.goalsFor - globalRanking.goalsAgainst}` : `${globalRanking.goalsFor - globalRanking.goalsAgainst}`} />
            </div>
          )}

          {members.length > 0 && (
            <section className="glass overflow-hidden rounded-[24px]">
              <div className="px-5 py-3.5 border-b border-white/[0.04]">
                <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">
                  Roster ({memberCount})
                </h2>
              </div>
              <ul className="divide-y divide-white/[0.03]">
                {members.map((m: any) => (
                  <li key={m.id} className="px-5 py-3.5 flex items-center gap-3 transition-colors duration-200 hover:bg-white/[0.02]">
                    <div className="h-10 w-10 rounded-[12px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center overflow-hidden" style={{ background: m.user.avatarUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))" }}>
                      {m.user.avatarUrl ? (
                        <img src={m.user.avatarUrl} alt="" className="h-full w-full rounded-[12px] object-cover" />
                      ) : (
                        <span className="text-[11px] font-bold text-accent">
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
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider " +
                        (m.role === "MANAGER"
                          ? "bg-accent/8 text-accent border border-accent/16"
                          : m.role === "CAPTAIN"
                          ? "bg-gold/8 text-gold border border-gold/16"
                          : "bg-white/[0.03] text-muted-faint border border-white/[0.05]")
                      }
                    >
                      {m.role}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recentMatches.length > 0 && (
            <section className="space-y-2.5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">Recent Matches</h2>
              <div className="space-y-2">
                {recentMatches.map((m: any) => {
                  const p1Name = m.player1.displayName || m.player1.username;
                  const p2Name = m.player2.displayName || m.player2.username;
                  const isP1Win = m.winnerId === m.player1.id;
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="block frosted-card-sm p-3.5 rounded-[18px] hover:border-accent/16 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${isP1Win ? "text-accent" : "text-ink"}`}>{p1Name}</span>
                        <div className="flex items-center gap-1.5 font-mono text-sm tabular-nums">
                          <span className={isP1Win ? "text-accent" : "text-ink"}>{m.score1}</span>
                          <span className="text-muted-faint">:</span>
                          <span className={!isP1Win ? "text-accent" : "text-ink"}>{m.score2}</span>
                        </div>
                        <span className={`text-xs font-medium ${!isP1Win && m.winnerId ? "text-accent" : "text-ink"}`}>{p2Name}</span>
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
        </ErrorBoundary>
      </div>
    </div>
  );
}

function ClubHeader({ name, tag, slug, logoUrl, bannerUrl, isVerified, membersInviteOnly, city, country, description }: any) {
  return (
    <div className="relative overflow-hidden rounded-[28px]" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
      <div
        className="aspect-[16/5] w-full bg-cover bg-center"
        style={{
          backgroundImage: bannerUrl
            ? `url(${bannerUrl})`
            : "linear-gradient(135deg, #0D0D0F, #16181D 60%, #111214)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0F] via-[#0D0D0F]/60 to-transparent" />
      <div className="absolute left-5 bottom-5 flex items-end gap-4">
        <div
          className="h-20 w-20 rounded-[18px] border border-white/[0.06] bg-cover bg-center shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
            backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
            background: logoUrl ? undefined : "linear-gradient(135deg, rgba(22,24,28,0.90), rgba(18,20,24,0.80))",
          }}
        >
          {!logoUrl && (
            <span className="bc-headline text-3xl text-accent">{tag?.[0] ?? name[0]}</span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="bc-headline text-2xl sm:text-3xl text-ink">{name}</h1>
            {isVerified && <span className="pill-accent text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Verified</span>}
            {membersInviteOnly && <span className="pill-gold text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Invite Only</span>}
          </div>
          <p className="font-mono text-[11px] text-muted-soft mt-0.5">
            [{tag}] · {city}, {country}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, variant }: { label: string; value: number | string; accent?: boolean; variant?: "cyan" | "emerald" | "orange" | "purple" }) {
  const v = variant || "";
  const glassClass = v === "cyan" ? "glass-cyan" : v === "emerald" ? "glass-emerald" : v === "orange" ? "glass-orange" : v === "purple" ? "glass-purple" : "";
  const gradientClass = v === "cyan" ? "text-gradient-cyan-blue" : v === "emerald" ? "text-gradient-lime-emerald" : v === "orange" ? "text-gradient-orange-gold" : v === "purple" ? "text-gradient-pink" : "";
  return (
    <div className={`${glassClass || "frosted-card-sm"} p-3.5 rounded-[20px] transition-all duration-300 hover:scale-[1.02]`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-soft">{label}</p>
      <p className={"bc-headline text-2xl mt-1 tabular-nums " + (accent ? "text-accent" : gradientClass || "text-ink")}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="frosted-card-sm p-3 rounded-[16px] text-center transition-all duration-300 hover:scale-[1.02]">
      <p className="bc-headline text-lg tabular-nums text-ink">{value}</p>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-faint mt-0.5">{label}</p>
    </div>
  );
}