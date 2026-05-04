import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMyClub } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";
import { MembersClient } from "./MembersClient";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/members");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");
  const myClub = await getMyClub(session);
  if (!myClub) {
    return <p className="text-white">Admins: pick a club to manage from the admin panel.</p>;
  }

  const members = await prisma.clubMember.findMany({
    where: { clubId: myClub.id },
    orderBy: [{ status: "asc" }, { joinedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          platform: true,
          stats: { select: { points: true, wins: true, losses: true, winStreak: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--bc-text-soft)]">
            Members
          </p>
          <h1 className="bc-headline text-3xl text-white">Roster</h1>
        </div>
      </header>
      <MembersClient clubId={myClub.id} initialMembers={JSON.parse(JSON.stringify(members))} />
    </div>
  );
}