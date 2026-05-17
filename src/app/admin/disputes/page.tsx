import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DisputesClient } from "./DisputesClient";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under Review",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: "text-negative border-negative/20 bg-negative/8",
  UNDER_REVIEW: "text-gold border-gold/20 bg-gold/8",
  RESOLVED: "text-accent border-accent/20 bg-accent/8",
  DISMISSED: "text-muted-soft border-border-faint bg-bg-highlight/40",
};

async function getDisputes() {
  const disputes = await prisma.matchDispute.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      match: {
        select: {
          id: true,
          score1: true,
          score2: true,
          status: true,
          statusRaw: true,
          player1: { select: { id: true, username: true, displayName: true } },
          player2: { select: { id: true, username: true, displayName: true } },
        },
      },
      reporter: { select: { id: true, username: true, displayName: true } },
      resolver: { select: { id: true, username: true, displayName: true } },
    },
  });

  const disputeIds = disputes.map((d) => d.id);

  const auditLogs = disputeIds.length > 0
    ? await prisma.auditLog.findMany({
        where: {
          OR: [
            { target: { in: disputeIds } },
            { target: { in: disputes.map((d) => d.matchId) } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          admin: { select: { id: true, username: true, displayName: true } },
        },
      })
    : [];

  return { disputes, auditLogs };
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin/disputes");
  if (session.role !== "ADMIN" && session.role !== "MANAGER") redirect("/dashboard");

  const params = await searchParams;
  const activeTab = params.tab || "OPEN";

  const { disputes, auditLogs } = await getDisputes();

  const tabs = ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"] as const;

  const filtered = disputes.filter((d) => d.status === activeTab);
  const counts = Object.fromEntries(
    tabs.map((t) => [t, disputes.filter((d) => d.status === t).length]),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-soft">
          Dispute Management
        </p>
        <h1 className="bc-headline text-3xl text-ink">Dispute Queue</h1>
        <p className="text-sm text-muted-soft mt-1">
          {disputes.length} total dispute{disputes.length !== 1 ? "s" : ""}
        </p>
      </header>

      <div className="flex gap-1 p-1 rounded-[14px] bg-bg-elevated/40 border border-border-faint overflow-x-auto">
        {tabs.map((tab) => (
          <a
            key={tab}
            href={`/admin/disputes?tab=${tab}`}
            className={`flex-1 py-2.5 px-3 rounded-[10px] text-[10px] font-black tracking-[0.14em] uppercase transition-all text-center whitespace-nowrap ${
              activeTab === tab
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted-soft hover:text-ink"
            }`}
          >
            {STATUS_LABELS[tab]} ({counts[tab]})
          </a>
        ))}
      </div>

      <DisputesClient
        disputes={JSON.parse(JSON.stringify(filtered))}
        auditLogs={JSON.parse(JSON.stringify(auditLogs))}
        activeTab={activeTab}
        statusColors={STATUS_COLORS}
        sessionRole={session.role}
      />
    </div>
  );
}
