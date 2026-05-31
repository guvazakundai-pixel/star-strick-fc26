import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { submitChallengeScore } from "@/lib/challenge-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { code } = await params;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.goalsFor !== "number" || typeof body.goalsAgainst !== "number") {
    return NextResponse.json({ error: "goalsFor and goalsAgainst are required" }, { status: 400 });
  }

  try {
    const result = await submitChallengeScore(code, auth.session.userId, body.goalsFor, body.goalsAgainst);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}