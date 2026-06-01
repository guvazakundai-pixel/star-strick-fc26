import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { adjustResult } from "@/lib/challenge-service";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  if (typeof body.challengerScore !== "number" || typeof body.opponentScore !== "number") {
    return NextResponse.json({ error: "challengerScore and opponentScore are required" }, { status: 400 });
  }

  try {
    const result = await adjustResult(
      body.code,
      auth.session.userId,
      body.challengerScore,
      body.opponentScore,
      body.screenshotUrl,
      body.notes,
    );
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
