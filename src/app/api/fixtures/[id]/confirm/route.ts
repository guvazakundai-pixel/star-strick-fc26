import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { canConfirm, roleFor, type FixtureStatus } from "@/lib/league/state";

export async function POST(
  _req: Request,
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

  if (!canConfirm(fixture.status as FixtureStatus, role, fixture.submittedById, auth.session.userId)) {
    return NextResponse.json({ error: "Cannot confirm this fixture" }, { status: 400 });
  }

  const updated = await prisma.fixture.update({
    where: { id },
    data: {
      confirmedById: auth.session.userId,
      confirmedAt: new Date(),
      status: "CONFIRMED",
    },
  });

  return NextResponse.json({ fixture: updated });
}
