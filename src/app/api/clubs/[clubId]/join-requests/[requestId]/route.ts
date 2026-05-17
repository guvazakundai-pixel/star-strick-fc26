import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clubId: string; requestId: string }> },
) {
  const { clubId, requestId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const member = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: auth.session.userId, clubId } },
  });
  const isManager = member?.role === "OWNER" || member?.role === "MANAGER";
  if (!isManager) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const request = await prisma.clubJoinRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.clubId !== clubId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { action } = await req.json();

  if (action === "APPROVE") {
    await prisma.clubJoinRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED", reviewedBy: auth.session.userId },
    });
    await prisma.clubMember.upsert({
      where: { userId_clubId: { userId: request.userId, clubId } },
      update: { status: "APPROVED" },
      create: {
        userId: request.userId,
        clubId,
        role: "MEMBER",
        status: "APPROVED",
      },
    });
    await prisma.clubActivity.create({
      data: {
        clubId,
        userId: request.userId,
        type: "NEW_SIGNING",
        message: `Joined the club`,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "REJECT") {
    await prisma.clubJoinRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED", reviewedBy: auth.session.userId },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
