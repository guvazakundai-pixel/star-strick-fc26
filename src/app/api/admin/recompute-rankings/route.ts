import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { recomputePlayerRankings, recomputeClubRankings } from "@/lib/ranking";
import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

async function dedupPlayerRankings(): Promise<number> {
  const dupes = await db.execute({
    sql: `SELECT user_id, COUNT(*) as c FROM player_rankings GROUP BY user_id HAVING c > 1`,
    args: [],
  });
  if (dupes.rows.length === 0) return 0;

  let removed = 0;
  for (const row of dupes.rows) {
    const userId = String((row as Record<string, unknown>).user_id);
    const rows = await db.execute({
      sql: `SELECT id, final_score, updated_at FROM player_rankings WHERE user_id = ? ORDER BY updated_at DESC, final_score DESC`,
      args: [userId],
    });
    const keepId = String((rows.rows[0] as Record<string, unknown>).id);
    await db.execute({
      sql: `DELETE FROM player_rankings WHERE user_id = ? AND id != ?`,
      args: [userId, keepId],
    });
    removed += rows.rows.length - 1;
  }
  return removed;
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "recompute", auth.session.userId), {
    windowMs: 60_000,
    max: 6,
  });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const dedupRemoved = await dedupPlayerRankings();

  const players = await recomputePlayerRankings();
  const clubs = await recomputeClubRankings();
  await audit(auth.session.userId, "RANK_RECOMPUTE", "USER", auth.session.userId, {
    players: players.updated,
    clubs: clubs.updated,
    duplicatesRemoved: dedupRemoved,
  });

  return NextResponse.json({ ok: true, ...players, clubs: clubs.updated, duplicatesRemoved: dedupRemoved });
}
