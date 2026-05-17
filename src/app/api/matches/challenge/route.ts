import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { createChallenge, validateChallenge } from "@/lib/match-engine/service";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "challenge", auth.session.userId), { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many challenges. Slow down." }, { status: 429, headers: { "X-RateLimit-Reset": String(rl.resetAt) } });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const { opponentId, matchType, platform, region, wagerAmount } = body;

  if (!matchType || !platform || !region) {
    return NextResponse.json({ error: "Match type, platform, and region are required" }, { status: 400 });
  }

  const validTypes = ["FRIEND_CHALLENGE", "RANKED", "QUICK_XP", "CLUB_BATTLE"];
  if (!validTypes.includes(matchType)) {
    return NextResponse.json({ error: "Invalid match type" }, { status: 400 });
  }

  if (opponentId) {
    const validation = await validateChallenge(auth.session.userId, opponentId);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }
  }

  const { matchRequestId, shareToken, shareUrls } = await createChallenge({
    challengerId: auth.session.userId,
    opponentId: opponentId ?? null,
    matchType,
    platform,
    region,
    wagerAmount: wagerAmount ?? 0,
  });

  return NextResponse.json({
    matchRequestId,
    shareToken,
    shareUrl: `https://star-strick-fc26.vercel.app/match/claim/${shareToken}`,
    shareUrls,
    expiresIn: "30 minutes",
  });
}
