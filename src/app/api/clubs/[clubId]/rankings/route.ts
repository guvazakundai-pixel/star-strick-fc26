import { NextResponse } from "next/server";
import { z } from "zod";
import { requireClubManager } from "@/lib/route-auth";
import { prisma } from "@/lib/prisma";

const reorderSchema = z.array(
  z.object({
    userId: z.string(),
    points: z.number().int().min(0),
  })
);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updates = parsed.data;
  for (let i = 0; i < updates.length; i++) {
    await prisma.clubRanking.upsert({
      where: { clubId_userId: { clubId, userId: updates[i].userId } },
      update: { rankPosition: i + 1, points: updates[i].points },
      create: { clubId, userId: updates[i].userId, rankPosition: i + 1, points: updates[i].points },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: auth.session.userId,
      actionType: "RANKING_REORDER",
      entityType: "CLUB",
      entityId: clubId,
      metadata: JSON.stringify({ count: updates.length }),
    },
  });

  return NextResponse.json({ ok: true, reordered: updates.length });
}
