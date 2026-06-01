import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { rejectResult } from "@/lib/challenge-service";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  if (!body.reason || typeof body.reason !== "string") {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  try {
    const result = await rejectResult(body.code, auth.session.userId, body.reason);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
