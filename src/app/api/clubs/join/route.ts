import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const JoinClubSchema = z.object({
  clubId: z.string().min(1),
});

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = JoinClubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { clubId } = parsed.data;

  const club = await prisma.club.findUnique({ where: { id: clubId } });
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
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

  const member = await prisma.clubMember.create({
    data: {
      userId: auth.session.userId,
      clubId,
      role: "PLAYER",
      status: club.isInviteOnly ? "PENDING" : "APPROVED",
    },
  });

  if (!club.isInviteOnly) {
    await prisma.user.update({
      where: { id: auth.session.userId },
      data: { clubId, joinedClubAt: new Date() },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: club.isInviteOnly ? "CLUB_APPLY" : "CLUB_JOIN",
      entityType: "CLUB",
      entityId: clubId,
      metadata: JSON.stringify({ clubName: club.name }),
    },
  });

  return NextResponse.json({
    member,
    status: club.isInviteOnly ? "PENDING" : "APPROVED",
  });
}