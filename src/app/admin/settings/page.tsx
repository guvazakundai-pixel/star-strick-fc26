import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminSettingsClient } from "./AdminSettingsClient";

export const dynamic = "force-dynamic";

async function getSystemHealth() {
  const metrics = await prisma.systemHealth.findMany({
    orderBy: { metric: "asc" },
  });
  return metrics;
}

async function getAggregateStats() {
  const [userCount, clubCount, matchCount, disputeCount, tournamentCount, leagueCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.club.count(),
      prisma.matchReport.count(),
      prisma.matchDispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.tournament.count(),
      prisma.league.count(),
    ]);
  return { userCount, clubCount, matchCount, disputeCount, tournamentCount, leagueCount };
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/settings");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const params = await searchParams;
  const activeTab = params.tab || "platform";

  const healthMetrics = await getSystemHealth();
  const stats = await getAggregateStats();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-soft">
          Administration
        </p>
        <h1 className="bc-headline text-3xl text-ink">Platform Settings</h1>
      </header>

      <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint overflow-x-auto">
        {[
          { key: "platform", label: "Platform" },
          { key: "points", label: "Points" },
          { key: "ranking", label: "Ranking" },
          { key: "social", label: "Social" },
          { key: "health", label: "Health" },
        ].map((tab) => (
          <a
            key={tab.key}
            href={`/admin/settings?tab=${tab.key}`}
            className={`flex-1 py-2.5 px-3 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all text-center whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted-soft hover:text-ink"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <AdminSettingsClient
        activeTab={activeTab}
        healthMetrics={JSON.parse(JSON.stringify(healthMetrics))}
        stats={stats}
      />
    </div>
  );
}
