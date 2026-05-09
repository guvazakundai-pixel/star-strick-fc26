import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, status: true, maxPlayers: true },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (tournament.status !== "REGISTRATION") {
    return NextResponse.json(
      { error: "Registration is not open for this tournament" },
      { status: 400 },
    );
  }

  const existing = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: auth.session.userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already registered" }, { status: 409 });
  }

  const participantCount = await prisma.tournamentParticipant.count({
    where: { tournamentId, status: { in: ["REGISTERED", "ACTIVE"] } },
  });
  if (participantCount >= tournament.maxPlayers) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  const participant = await prisma.tournamentParticipant.create({
    data: {
      tournamentId,
      userId: auth.session.userId,
      seed: participantCount + 1,
    },
  });

  return NextResponse.json({ participant }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const existing = await prisma.tournamentParticipant.findUnique({
    where: { tournamentId_userId: { tournamentId, userId: auth.session.userId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not registered" }, { status: 404 });
  }
  if (existing.status === "ELIMINATED" || existing.status === "WITHDRAWN") {
    return NextResponse.json({ error: "Cannot withdraw in current state" }, { status: 400 });
  }

  await prisma.tournamentParticipant.update({
    where: { id: existing.id },
    data: { status: "WITHDRAWN" },
  });

  return NextResponse.json({ success: true });
}