import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const AwardSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int(),
  reason: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN", "MANAGER");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = AwardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { userId, points, reason } = parsed.data;

  let userWhere: { id: string } | { username: string };
  if (userId.length === 36 && userId.includes("-")) {
    userWhere = { id: userId };
  } else {
    userWhere = { username: userId };
  }

  const user = await prisma.user.findFirst({ where: userWhere, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const pointEvent = await prisma.pointEvent.create({
    data: {
      userId: user.id,
      points,
      reason,
      awardedById: auth.session.userId,
    },
    select: {
      id: true,
      userId: true,
      points: true,
      reason: true,
      createdAt: true,
    },
  });

  const existing = await prisma.playerRanking.findUnique({ where: { userId: user.id } });
  if (existing) {
    await prisma.playerRanking.update({
      where: { userId: user.id },
      data: { points: { increment: points } },
    });
  } else {
    await prisma.playerRanking.create({
      data: { userId: user.id, points, rankPosition: 9999 },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: "POINTS_AWARD",
      entityType: "USER",
      entityId: user.id,
      metadata: JSON.stringify({ points, reason }),
    },
  });

  return NextResponse.json({ event: { ...pointEvent, user: { id: user.id } } });
}