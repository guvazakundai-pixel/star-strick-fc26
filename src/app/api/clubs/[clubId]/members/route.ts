import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  const session = auth.ok ? auth.session : null;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { managerId: true, createdByUserId: true },
  });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isManager = session?.userId === club.managerId ||
    session?.userId === club.createdByUserId ||
    session?.role === "ADMIN";

  const where = isManager ? { clubId } : { clubId, status: "APPROVED" as const };

  const members = await prisma.clubMember.findMany({
    where,
    orderBy: [{ status: "asc" }, { clubXp: "desc" }, { joinedAt: "asc" }],
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          country: true,
          platform: true,
          stats: {
            select: {
              points: true,
              wins: true,
              losses: true,
              draws: true,
              skillRating: true,
              winStreak: true,
              goalsScored: true,
            },
          },
          playerRanking: { select: { rankPosition: true } },
        },
      },
    },
  });

  return NextResponse.json({ members });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, managerId: true },
  });
  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  const callerMembership = await prisma.clubMember.findFirst({
    where: { userId: auth.session.userId, clubId, status: "APPROVED" },
    select: { role: true },
  });

  const isManager = auth.session.userId === club.managerId ||
    auth.session.role === "ADMIN" ||
    callerMembership?.role === "OWNER" ||
    callerMembership?.role === "MANAGER";

  if (!isManager) {
    return NextResponse.json({ error: "Only club management can manage members" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { userId, action, role } = body;

  const targetMember = await prisma.clubMember.findFirst({
    where: { userId, clubId },
    select: { id: true, role: true, status: true },
  });
  if (!targetMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  switch (action) {
    case "approve": {
      await prisma.clubMember.update({
        where: { id: targetMember.id },
        data: { status: "APPROVED", role: "MEMBER" },
      });
      await prisma.user.update({
        where: { id: userId },
        data: { clubId, joinedClubAt: new Date() },
      });
      await prisma.clubActivity.create({
        data: {
          clubId,
          userId: auth.session.userId,
          type: "MEMBER_JOINED",
          message: `Member application approved`,
          metadata: { approvedUserId: userId },
        },
      });
      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    case "reject": {
      await prisma.clubMember.delete({ where: { id: targetMember.id } });
      return NextResponse.json({ success: true, status: "REJECTED" });
    }

    case "promote": {
      const validRoles = ["MEMBER", "PRO", "CAPTAIN", "MANAGER", "LEGEND"];
      if (!role || !validRoles.includes(role)) {
        return NextResponse.json({ error: `Invalid role. Valid: ${validRoles.join(", ")}` }, { status: 400 });
      }
      await prisma.clubMember.update({
        where: { id: targetMember.id },
        data: { role },
      });
      if (role === "LEGEND") {
        const club = await prisma.club.findUnique({ where: { id: clubId }, select: { featuredLegends: true } });
        const legends = club?.featuredLegends ? JSON.parse(club.featuredLegends) : [];
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true, username: true } });
        const legendName = user?.displayName || user?.username || "";
        if (legendName && !legends.includes(legendName)) {
          legends.push(legendName);
          await prisma.club.update({
            where: { id: clubId },
            data: { featuredLegends: JSON.stringify(legends) },
          });
        }
      }
      return NextResponse.json({ success: true, role });
    }

    case "demote": {
      await prisma.clubMember.update({
        where: { id: targetMember.id },
        data: { role: "MEMBER" },
      });
      return NextResponse.json({ success: true, role: "MEMBER" });
    }

    case "kick": {
      await prisma.clubMember.delete({ where: { id: targetMember.id } });
      await prisma.user.update({
        where: { id: userId },
        data: { clubId: null, joinedClubAt: null },
      });
      return NextResponse.json({ success: true, status: "REMOVED" });
    }

    case "title": {
      if (!body.title) {
        return NextResponse.json({ error: "title required" }, { status: 400 });
      }
      await prisma.clubMember.update({
        where: { id: targetMember.id },
        data: { title: body.title },
      });
      return NextResponse.json({ success: true, title: body.title });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
