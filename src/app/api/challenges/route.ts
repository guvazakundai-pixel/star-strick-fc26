import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { createChallenge, getChallengesForUser } from "@/lib/challenge-service";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const rl = rateLimit(rateLimitKey(req, "challenge", auth.session.userId), { max: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many challenges. Slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.opponentId) {
    return NextResponse.json({ error: "opponentId is required" }, { status: 400 });
  }

  try {
    const challenge = await createChallenge(auth.session.userId, body.opponentId);
    const baseUrl = process.env.NEXT_PUBLIC_URL || "https://zimfcpro.co.zw";
    return NextResponse.json({
      ...challenge,
      url: `${baseUrl}/challenges/${challenge.code}`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const challenges = await getChallengesForUser(auth.session.userId);
  return NextResponse.json({ challenges });
}