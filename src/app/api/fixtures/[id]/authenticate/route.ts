import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/route-auth";
import { canAuthenticate, roleFor, type FixtureStatus } from "@/lib/league/state";
import { recalcStandings } from "@/lib/league/recalc";

const AuthSchema = z.object({
  decision: z.enum(["APPROVE", "OVERRIDE", "VOID"]),
  homeScore: z.coerce.number().int().min(0).max(99).optional(),
  awayScore: z.coerce.number().int().min(0).max(99).optional(),
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
      season: { select: { id: true, league: { select: { ownerId: true } } } },
    },
  });
  if (!fixture) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = fixture.season.league.ownerId === auth.session.userId;
  const role = roleFor(auth.session.userId, fixture, isOwner);

  if (!canAuthenticate(fixture.status as FixtureStatus, role)) {
    return NextResponse.json({ error: "Cannot authenticate this fixture" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AuthSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  let finalHomeScore: number | null = null;
  let finalAwayScore: number | null = null;
  let nextStatus: FixtureStatus = "AUTHENTICATED";

  if (parsed.data.decision === "VOID") {
    nextStatus = "VOID";
  } else if (parsed.data.decision === "OVERRIDE") {
    if (parsed.data.homeScore === undefined || parsed.data.awayScore === undefined) {
      return NextResponse.json(
        { error: "OVERRIDE requires homeScore and awayScore" },
        { status: 400 },
      );
    }
    finalHomeScore = parsed.data.homeScore;
    finalAwayScore = parsed.data.awayScore;
  } else {
    // APPROVE — use submitted scores
    if (fixture.submittedHomeScore === null || fixture.submittedAwayScore === null) {
      return NextResponse.json(
        { error: "No submitted score to approve" },
        { status: 400 },
      );
    }
    finalHomeScore = fixture.submittedHomeScore;
    finalAwayScore = fixture.submittedAwayScore;
  }

  await prisma.fixture.update({
    where: { id },
    data: {
      homeScore: finalHomeScore,
      awayScore: finalAwayScore,
      authenticatedById: auth.session.userId,
      authenticatedAt: new Date(),
      status: nextStatus,
      notes: parsed.data.notes ?? fixture.notes,
    },
  });

  await recalcStandings(fixture.season.id);

  return NextResponse.json({ ok: true, status: nextStatus });
}
