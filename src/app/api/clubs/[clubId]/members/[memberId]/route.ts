import { NextResponse } from "next/server";
import { requireClubManager } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> },
) {
  const { clubId, memberId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const status = body?.status;
  const role = body?.role;

  if (status && !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (role && !["PLAYER", "CAPTAIN"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const member = await prisma.clubMember.findUnique({ where: { id: memberId } });
  if (!member || member.clubId !== clubId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (status) data.status = status;
  if (role) data.role = role;

  const updated = await prisma.clubMember.update({
    where: { id: memberId },
    data,
  });

  if (status === "APPROVED") {
    await prisma.user.update({
      where: { id: member.userId },
      data: { clubId },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: status === "APPROVED" ? "MEMBER_APPROVE" : status === "REJECTED" ? "MEMBER_REJECT" : "MEMBER_PROMOTE",
      entityType: "CLUB_MEMBER",
      entityId: memberId,
    },
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ clubId: string; memberId: string }> },
) {
  const { clubId, memberId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const member = await prisma.clubMember.findUnique({ where: { id: memberId } });
  if (!member || member.clubId !== clubId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.clubMember.delete({ where: { id: memberId } });

  await prisma.user.update({
    where: { id: member.userId },
    data: { clubId: null },
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: "MEMBER_REMOVE",
      entityType: "CLUB_MEMBER",
      entityId: memberId,
    },
  });

  return NextResponse.json({ ok: true });
}
