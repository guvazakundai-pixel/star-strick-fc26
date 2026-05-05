import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") {
    redirect("/dashboard");
  }

  const [userCount, clubCount, matchCount] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.match.count(),
  ]);

  return (
    <div className="broadcast-theme min-h-screen -mb-24">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row">
        <AdminSidebar
          role={session.role}
          stats={{ users: userCount, clubs: clubCount, matches: matchCount }}
        />
        <section className="flex-1 min-w-0 px-4 py-6 md:px-8">{children}</section>
      </div>
    </div>
  );
}
