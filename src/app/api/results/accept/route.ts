import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { verifyResult } from "@/lib/challenge-service";

export async function POST(req: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { searchParams } = new URL(req.url);
  const code = body.code || searchParams.get("code");

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "challenge code is required" }, { status: 400 });
  }

  try {
    const result = await verifyResult(code, auth.session.userId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
