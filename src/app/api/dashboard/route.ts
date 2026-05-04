import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getMyClub } from "@/lib/route-auth";

/**
 * GET /api/dashboard
 * Returns the manager's club + aggregated stats for the dashboard overview.
 * ADMINs without a club get { club: null }.
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const myClub = await getMyClub(auth.session);
  if (!myClub) {
    return NextResponse.json({ club: null });
  }

  const [club, memberCount, pendingCount, mediaCount, recentAudits] = await Promise.all([
    prisma.club.findUniqueOrThrow({
      where: { id: myClub.id },
      include: {
        globalRanking: true,
        createdBy: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.clubMember.count({ where: { clubId: myClub.id, status: "APPROVED" } }),
    prisma.clubMember.count({ where: { clubId: myClub.id, status: "PENDING" } }),
    prisma.media.count({ where: { clubId: myClub.id } }),
    prisma.auditLog.findMany({
      where: { entityType: "CLUB", entityId: myClub.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { username: true, displayName: true } } },
    }),
  ]);

  return NextResponse.json({
    club,
    counts: { members: memberCount, pending: pendingCount, media: mediaCount },
    activity: recentAudits.map((a) => ({
      id: a.id,
      action: a.actionType,
      actor: a.actor.displayName ?? a.actor.username,
      at: a.createdAt,
      metadata: a.metadata ? JSON.parse(a.metadata) : null,
    })),
  });
}
