import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

const PatchSchema = z.object({
  action: z.enum(["accept", "decline"]),
});

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { action } = parsed.data;

  const request = await prisma.matchRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (request.receiverId !== auth.session.userId) {
    return NextResponse.json({ error: "Only the receiver can accept or decline" }, { status: 403 });
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Request is no longer pending" }, { status: 400 });
  }

  if (request.expiresAt && request.expiresAt < new Date()) {
    await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: "EXPIRED", statusRaw: "EXPIRED" },
    });
    return NextResponse.json({ error: "Request has expired" }, { status: 400 });
  }

  if (action === "accept") {
    const updated = await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED", statusRaw: "ACCEPTED" },
      include: {
        sender: { select: playerSelect },
        receiver: { select: playerSelect },
        club: { select: clubSelect },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: auth.session.userId,
        action: "MATCH_REQUEST_ACCEPT",
        target: `MATCH_REQUEST:${requestId}`,
        details: { senderId: request.senderId },
      },
    });

    return NextResponse.json({ request: updated });
  }

  if (action === "decline") {
    const updated = await prisma.matchRequest.update({
      where: { id: requestId },
      data: { status: "DECLINED", statusRaw: "DECLINED" },
      include: {
        sender: { select: playerSelect },
        receiver: { select: playerSelect },
        club: { select: clubSelect },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: auth.session.userId,
        action: "MATCH_REQUEST_DECLINE",
        target: `MATCH_REQUEST:${requestId}`,
        details: { senderId: request.senderId },
      },
    });

    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}