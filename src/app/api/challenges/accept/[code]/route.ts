import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { acceptChallenge } from "@/lib/challenge-service";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  const { code } = await params;

  try {
    const result = await acceptChallenge(code, auth.session.userId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}