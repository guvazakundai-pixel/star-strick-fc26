import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { resolveDispute } from "@/lib/match-engine/service";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const disputes = await prisma.dispute.findMany({
    where: { status: "OPEN" },
    include: {
      reporter: { select: { id: true, username: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const matchIds = disputes.map((d) => d.matchId);
  const matches = await prisma.matchReport.findMany({
    where: { id: { in: matchIds } },
    include: {
      player1: { select: { id: true, username: true, displayName: true } },
      player2: { select: { id: true, username: true, displayName: true } },
    },
  });

  const matchMap = new Map(matches.map((m) => [m.id, m]));

  const enriched = disputes.map((d) => ({
    id: d.id,
    matchId: d.matchId,
    reason: d.reason,
    status: d.status,
    createdAt: d.createdAt,
    reporter: d.reporter,
    match: matchMap.get(d.matchId) ?? null,
  }));

  return NextResponse.json({ disputes: enriched, total: enriched.length });
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { matchId, action } = body;

  if (!matchId || !["overturn", "flag_user", "cancel"].includes(action)) {
    return NextResponse.json({ error: "matchId and action (overturn|flag_user|cancel) required" }, { status: 400 });
  }

  await resolveDispute(auth.session.userId, matchId, action);

  return NextResponse.json({ success: true, message: `Dispute resolved: ${action}` });
}
