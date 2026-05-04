import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMyClub } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/settings");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");
  const myClub = await getMyClub(session);
  if (!myClub) return <p className="text-white">Pick a club first.</p>;

  const club = await prisma.club.findUniqueOrThrow({ where: { id: myClub.id } });

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Settings
        </p>
        <h1 className="bc-headline text-3xl text-white">Club identity</h1>
      </header>
      <SettingsClient
        clubId={club.id}
        initial={{
          name: club.name,
          tag: club.tag,
          city: club.city,
          description: club.description ?? "",
          isInviteOnly: club.isInviteOnly,
          logoUrl: club.logoUrl ?? "",
          bannerUrl: club.bannerUrl ?? "",
        }}
      />
    </div>
  );
}