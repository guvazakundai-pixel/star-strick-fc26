import { NextResponse } from "next/server";
import { requireRole } from "@/lib/route-auth";
import { recomputePlayerRankings, recomputeClubRankings } from "@/lib/ranking";
import { audit } from "@/lib/audit";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

/**
 * POST /api/admin/recompute-rankings
 * Recomputes BOTH player and club global leaderboards. Admin-only.
 */
export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "recompute", auth.session.userId), {
    windowMs: 60_000,
    max: 6,
  });
  if (!rl.allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const players = await recomputePlayerRankings();
  const clubs = await recomputeClubRankings();
  await audit(auth.session.userId, "RANK_RECOMPUTE", "USER", auth.session.userId, {
    players: players.updated,
    clubs: clubs.updated,
  });

  return NextResponse.json({ ok: true, ...players, clubs: clubs.updated });
}
