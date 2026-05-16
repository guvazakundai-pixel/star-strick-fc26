import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/route-auth";
import { verifyScore } from "@/lib/match-engine/service";

export async function POST(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { matchId } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { confirm, disputeReason } = body;

  if (confirm !== true && confirm !== false) {
    return NextResponse.json({ error: "confirm must be true or false" }, { status: 400 });
  }

  const result = await verifyScore({
    matchId,
    playerId: auth.session.userId,
    confirm,
    disputeReason,
  });

  if (confirm) {
    return NextResponse.json({
      status: "COMPLETED",
      message: "Match verified successfully! XP and rankings updated.",
      xpResult: result.xpResult ?? null,
    });
  } else {
    return NextResponse.json({
      status: "DISPUTED",
      message: "Match has been disputed. An admin will review.",
      disputeTicketCreated: true,
    });
  }
}
