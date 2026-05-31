import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/route-auth";
import { getDisputedChallenges, adminResolveDispute } from "@/lib/challenge-service";

export async function GET() {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;
  const disputes = await getDisputedChallenges();
  return NextResponse.json({ disputes });
}

export async function POST(req: Request) {
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  if (!body || !body.code || !body.action) {
    return NextResponse.json({ error: "code and action are required" }, { status: 400 });
  }

  try {
    const result = await adminResolveDispute(auth.session.userId, body.code, body.action);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}