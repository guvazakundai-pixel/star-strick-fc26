import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { canSubmit, roleFor, type FixtureStatus } from "@/lib/league/state";

const SubmitSchema = z.object({
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

  if (!canSubmit(fixture.status as FixtureStatus, role)) {
    return NextResponse.json(
      { error: `Cannot submit when fixture is ${fixture.status}` },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.fixture.update({
    where: { id },
    data: {
      submittedById: auth.session.userId,
      submittedAt: new Date(),
      submittedHomeScore: parsed.data.homeScore,
      submittedAwayScore: parsed.data.awayScore,
      notes: parsed.data.notes ?? fixture.notes,
      status: "SUBMITTED",
      // Reset prior confirmation/dispute fields when re-submitting after a dispute
      confirmedById: null,
      confirmedAt: null,
      disputedHomeScore: null,
      disputedAwayScore: null,
    },
  });

  return NextResponse.json({ fixture: updated });
}
