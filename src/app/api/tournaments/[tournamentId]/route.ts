import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/route-auth";

const PatchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(["KNOCKOUT", "ROUND_ROBIN", "GROUPS"]).optional(),
  status: z.enum(["DRAFT", "REGISTRATION", "LIVE", "COMPLETED"]).optional(),
  city: z.string().max(80).optional(),
  prizePool: z.coerce.number().int().min(0).optional(),
  maxPlayers: z.coerce.number().int().min(2).max(256).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      organizer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      participants: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { seed: "asc" },
      },
      matches: {
        include: {
          player1: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          winner: { select: { id: true, username: true, displayName: true } },
        },
        orderBy: [{ round: "asc" }, { matchIndex: "asc" }],
      },
    },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ tournament });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tournamentId: string }> },
) {
  const { tournamentId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });
  if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOrganizer = tournament.organizerId === auth.session.userId;
  const isAdmin = auth.session.role === "ADMIN";
  if (!isOrganizer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { startAt, endAt, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null;
  if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data,
  });

  return NextResponse.json({ tournament: updated });
}