import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/route-auth";

const PatchSchema = z.object({
  action: z.enum(["approve", "dispute"]),
  notes: z.string().max(1000).optional(),
});

const playerSelect = { id: true, username: true, displayName: true, avatarUrl: true } as const;
const playerSelectShort = { id: true, username: true, displayName: true } as const;
const clubSelect = { id: true, name: true, tag: true } as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const match = await prisma.matchReport.findUnique({
    where: { id: matchId },
    include: {
      player1: { select: playerSelect },
      player2: { select: playerSelect },
      winner: { select: playerSelectShort },
      club: { select: clubSelect },
      approvedBy: { select: { id: true, username: true } },
      submittedBy: { select: { id: true, username: true } },
    },
  });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  return NextResponse.json({ match });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const auth = await requireRole("ADMIN");
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { action, notes } = parsed.data;

  const match = await prisma.matchReport.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  if (action === "approve") {
    if (match.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Only confirmed matches can be approved" },
        { status: 400 },
      );
    }
    const updated = await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        status: "APPROVED",
        statusRaw: "APPROVED",
        approvedById: auth.session.userId,
        approvedAt: new Date(),
      },
    });
    await prisma.auditLog.create({
      data: {
        adminId: auth.session.userId,
        action: "MATCH_APPROVE",
        target: `MATCH_REPORT:${matchId}`,
        details: { notes },
      },
    });
    return NextResponse.json({ match: updated });
  }

  if (action === "dispute") {
    const updated = await prisma.matchReport.update({
      where: { id: matchId },
      data: {
        isDisputed: true,
        notes: notes ? `${match.notes ?? ""}\n[DISPUTE]: ${notes}`.trim() : match.notes,
      },
    });
    await prisma.auditLog.create({
      data: {
        adminId: auth.session.userId,
        action: "MATCH_DISPUTE",
        target: `MATCH_REPORT:${matchId}`,
        details: { notes },
      },
    });
    return NextResponse.json({ match: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}