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
  const club = await prisma.club.findUnique({
    where: { tag: tag.toUpperCase() },
    select: {
      id: true,
      name: true,
      tag: true,
      logoUrl: true,
      bannerUrl: true,
      description: true,
      city: true,
      country: true,
      isVerified: true,
      isInviteOnly: true,
      createdByUserId: true,
      createdAt: true,
    },
  });

  if (!club) notFound();

  const [memberCount, globalRanking, members] = await Promise.all([
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
  ]);

  const creator = await prisma.user.findUnique({
    where: { id: club.createdByUserId },
    select: { username: true, displayName: true },
  });

  return (
    <div className="broadcast-theme min-h-screen bc-noise">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="relative overflow-hidden rounded-xl border border-[#333]">
          <div
            className="aspect-[16/5] w-full bg-cover bg-center bc-noise"
            style={{
              backgroundImage: club.bannerUrl
                ? `url(${club.bannerUrl})`
                : "linear-gradient(135deg,#0a0a0a,#1a1a1a 60%,#050505)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute left-4 bottom-4 flex items-end gap-4">
            <div
              className="h-20 w-20 rounded-lg border border-[#333] bg-black bg-cover bg-center shrink-0 flex items-center justify-center"
              style={{ backgroundImage: club.logoUrl ? `url(${club.logoUrl})` : undefined }}
            >
              {!club.logoUrl && (
                <span className="bc-headline text-3xl text-[#00ff85]">{club.tag[0]}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="bc-headline text-2xl sm:text-3xl text-white">{club.name}</h1>
                {club.isVerified ? (
                  <span className="inline-flex items-center rounded bg-[#00ff85]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#00ff85]">
                    Verified
                  </span>
                ) : null}
                {club.isInviteOnly && (
                  <span className="inline-flex items-center rounded bg-[#ffb800]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#ffb800]">
                    Invite Only
                  </span>
                )}
              </div>
              <p className="font-mono text-[11px] text-[#9a9a9a]">
                [{club.tag}] · {club.city}, {club.country}
              </p>
            </div>
          </div>
        </div>

        {club.description && (
          <p className="text-sm text-[#9a9a9a] leading-relaxed">{club.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox label="Members" value={memberCount} />
          <StatBox label="Global Rank" value={globalRanking ? `#${globalRanking.rankPosition}` : "—"} accent={!!globalRanking} />
          <StatBox label="Points" value={globalRanking?.totalPoints ?? 0} />
          <StatBox label="Wins" value={globalRanking?.wins ?? 0} />
        </div>

        <section className="rounded-xl border border-[#333] bg-[#1a1a1a]/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#333]">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-[#9a9a9a]">
              Roster
            </h2>
          </div>
          <ul className="divide-y divide-[#333]">
            {members.map((m) => (
              <li key={m.id} className="px-4 py-3 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg border border-[#333] bg-black bg-cover bg-center shrink-0 flex items-center justify-center">
                  {m.user.avatarUrl ? (
                    <img src={m.user.avatarUrl} alt="" className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-[#00ff85]">
                      {(m.user.displayName || m.user.username)[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/player/${m.user.username}`}
                    className="text-sm text-white hover:text-[#00ff85] transition-colors font-medium"
                  >
                    {m.user.displayName || m.user.username}
                  </Link>
                  <p className="font-mono text-[10px] text-[#9a9a9a]">@{m.user.username}</p>
                </div>
                <span
                  className={
                    "text-[10px] font-bold uppercase tracking-wider " +
                    (m.role === "MANAGER"
                      ? "text-[#00ff85]"
                      : m.role === "CAPTAIN"
                        ? "text-[#ffb800]"
                        : "text-[#666]")
                  }
                >
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="text-center font-mono text-[10px] text-[#666]">
          Founded {club.createdAt.toLocaleDateString()} by{" "}
          <Link
            href={`/player/${creator?.username ?? ""}`}
            className="text-[#9a9a9a] hover:text-[#00ff85]"
          >
            {creator?.displayName ?? creator?.username ?? "Unknown"}
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
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (accent ? "border-[#00ff85]/30 bg-[#00ff85]/5" : "border-[#333] bg-[#1a1a1a]/50")
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-[#9a9a9a]">{label}</p>
      <p className="bc-headline text-2xl text-white mt-1 tabular-nums">{value}</p>
    </div>
  );
}