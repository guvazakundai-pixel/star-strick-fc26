import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const JoinClubSchema = z.object({
  clubId: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = JoinClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Provide clubId or invite code" }, { status: 400 });
  }

  let clubId = parsed.data.clubId;

  if (parsed.data.code && !clubId) {
    const clubByCode = await prisma.club.findUnique({
      where: { joinCode: parsed.data.code },
      select: { id: true, name: true, membersInviteOnly: true, isPublic: true },
    });
    if (!clubByCode) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }
    clubId = clubByCode.id;
  }

  if (!clubId) {
    return NextResponse.json({ error: "Provide clubId or invite code" }, { status: 400 });
  }

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  if (!club.isPublic && !parsed.data.code) {
    return NextResponse.json({ error: "This club is private. You need an invite code." }, { status: 403 });
  }

  const existing = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already a member or pending application" }, { status: 409 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.userId },
    select: { clubId: true },
  });
  if (user?.clubId) {
    return NextResponse.json({ error: "You are already in a club. Leave your current club first." }, { status: 400 });
  }

  const autoApprove = !club.membersInviteOnly;
  const member = await prisma.clubMember.create({
    data: {
      userId: auth.session.userId,
      clubId,
      role: "RECRUIT",
      status: autoApprove ? "APPROVED" : "PENDING",
    },
  });

  if (autoApprove) {
    await prisma.user.update({
      where: { id: auth.session.userId },
      data: { clubId, joinedClubAt: new Date() },
    });

    await prisma.clubActivity.create({
      data: {
        clubId,
        userId: auth.session.userId,
        type: "MEMBER_JOINED",
        message: `New member joined the club`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      adminId: auth.session.userId,
      action: autoApprove ? "CLUB_JOIN" : "CLUB_APPLY",
      target: `CLUB:${clubId}`,
      details: { clubName: club.name, method: parsed.data.code ? "invite_code" : "direct" },
    },
  });

  return NextResponse.json({
    member,
    status: autoApprove ? "APPROVED" : "PENDING",
    clubName: club.name,
  });
}
