import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const request = await prisma.matchRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.senderId !== auth.session.userId) {
    return NextResponse.json({ error: "Only the sender can cancel a request" }, { status: 403 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Can only cancel pending requests" }, { status: 400 });
  }

  const updated = await prisma.matchRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", statusRaw: "CANCELLED" },
    include: {
      sender: { select: playerSelect },
      receiver: { select: playerSelect },
      club: { select: clubSelect },
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: auth.session.userId,
      action: "MATCH_REQUEST_CANCEL",
      target: `MATCH_REQUEST:${requestId}`,
      details: { receiverId: request.receiverId },
    },
  });

  return NextResponse.json({ request: updated });
}