import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { canDispute, roleFor, type FixtureStatus } from "@/lib/league/state";

const DisputeSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(99),
  awayScore: z.coerce.number().int().min(0).max(99),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const fixture = await prisma.fixture.findUnique({
    where: { id },
    include: {
      season: { select: { league: { select: { ownerId: true } } } },
    },
  });
  if (!fixture) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = fixture.season.league.ownerId === auth.session.userId;
  const role = roleFor(auth.session.userId, fixture, isOwner);

  if (!canDispute(fixture.status as FixtureStatus, role, fixture.submittedById, auth.session.userId)) {
    return NextResponse.json({ error: "Cannot dispute this fixture" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = DisputeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.fixture.update({
    where: { id },
    data: {
      disputedHomeScore: parsed.data.homeScore,
      disputedAwayScore: parsed.data.awayScore,
      status: "DISPUTED",
      notes: parsed.data.notes ?? fixture.notes,
    },
  });

  return NextResponse.json({ fixture: updated });
}
