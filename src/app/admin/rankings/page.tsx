import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMyClub } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";
import { RankingsClient } from "./RankingsClient";

export const dynamic = "force-dynamic";

export default async function AdminRankingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/rankings");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");
  const myClub = await getMyClub(session);
  if (!myClub) {
    return <p className="text-white">Pick a club first.</p>;
  }

  const rankings = await prisma.clubRanking.findMany({
    where: { clubId: myClub.id },
    orderBy: { rankPosition: "asc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          stats: { select: { wins: true, losses: true, winStreak: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Internal rankings
        </p>
        <h1 className="bc-headline text-3xl text-white">Drag to reorder</h1>
        <p className="text-sm text-[var(--bc-text-soft)] mt-1">
          Manager-controlled ranking visible inside your club page. Updates are saved atomically.
        </p>
      </header>
      <RankingsClient
        clubId={myClub.id}
        initial={JSON.parse(JSON.stringify(rankings))}
      />
    </div>
  );
}