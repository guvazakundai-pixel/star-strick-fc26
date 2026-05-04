import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMyClub } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";
import { MediaClient } from "./MediaClient";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/media");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");
  const myClub = await getMyClub(session);
  if (!myClub) return <p className="text-white">Pick a club first.</p>;

  const media = await prisma.media.findMany({
    where: { clubId: myClub.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--bc-text-soft)]">
          Media
        </p>
        <h1 className="bc-headline text-3xl text-white">Gallery & posts</h1>
      </header>
      <MediaClient clubId={myClub.id} initial={JSON.parse(JSON.stringify(media))} />
    </div>
  );
}