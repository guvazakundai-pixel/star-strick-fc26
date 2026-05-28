import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";
import { resolveDispute } from "@/lib/match-engine/service";
import { audit } from "@/lib/audit";

const ResolveSchema = z.object({
  action: z.enum(["overturn", "cancel", "flag_user"]),
  winnerId: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = ResolveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, winnerId, reason } = parsed.data;

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  if (match.statusRaw !== "DISPUTED" && match.statusRaw !== "ADMIN_REVIEW") {
    return NextResponse.json({ error: "Match is not in a disputed state" }, { status: 400 });
  }

  if (action === "overturn") {
    if (!winnerId) {
      return NextResponse.json({ error: "winnerId required for overturn" }, { status: 400 });
    }
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return NextResponse.json({ error: "winnerId must be one of the match players" }, { status: 400 });
    }
    await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        status: "COMPLETED",
        statusRaw: "COMPLETED",
        winnerId,
        approvedById: auth.session.userId,
        approvedAt: new Date(),
        notes: reason ?? "Admin overturn",
      },
    });
  }

  await resolveDispute(auth.session.userId, matchId, action);
  await audit(auth.session.userId, "DISPUTE_RESOLVE", matchId, { action, winnerId, reason });

  const updated = await prisma.matchReport.findUnique({ where: { id: matchId } });
  return NextResponse.json({ match: updated, action });
}