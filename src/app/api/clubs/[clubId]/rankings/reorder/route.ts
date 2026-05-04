import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireClubManager } from "@/lib/route-auth";
import { audit } from "@/lib/audit";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

const ReorderSchema = z.object({
  order: z
    .array(
      z.object({
        userId: z.string().min(1),
        points: z.number().int().min(0).max(100_000).optional(),
      }),
    )
    .min(1)
    .max(200),
});

/**
 * POST /api/clubs/[clubId]/rankings/reorder
 * Body: { order: [{ userId, points? }, ...] }  // index = new rank-1
 * Transactional: writes all positions atomically. Two-phase write to avoid
 * any transient duplicate-position state (we don't have a partial unique idx,
 * but we still want crash-safe semantics).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireClubManager(clubId);
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "ranking-reorder", auth.session.userId), {
    windowMs: 60_000,
    max: 30,
  });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const userIds = parsed.data.order.map((o) => o.userId);
  const existing = await prisma.clubRanking.findMany({
    where: { clubId, userId: { in: userIds } },
    select: { userId: true },
  });
  const existingSet = new Set(existing.map((e) => e.userId));
  const missing = userIds.filter((u) => !existingSet.has(u));
  if (missing.length) {
    return NextResponse.json(
      { error: "Some users are not in this club", missing },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Phase 1: park every targeted row at a high temporary slot to free the canonical range.
    for (let i = 0; i < parsed.data.order.length; i++) {
      const o = parsed.data.order[i];
      await tx.clubRanking.update({
        where: { clubId_userId: { clubId, userId: o.userId } },
        data: { rankPosition: 100_000 + i },
      });
    }
    // Phase 2: write final positions.
    for (let i = 0; i < parsed.data.order.length; i++) {
      const o = parsed.data.order[i];
      await tx.clubRanking.update({
        where: { clubId_userId: { clubId, userId: o.userId } },
        data: { rankPosition: i + 1, ...(o.points != null ? { points: o.points } : {}) },
      });
    }
  });

  await audit(auth.session.userId, "RANKING_REORDER", "CLUB_RANKING", clubId, {
    count: parsed.data.order.length,
  });
  await audit(auth.session.userId, "CLUB_UPDATE", "CLUB", clubId, { via: "rankings" });

  const rankings = await prisma.clubRanking.findMany({
    where: { clubId },
    orderBy: { rankPosition: "asc" },
  });
  return NextResponse.json({ rankings });
}
