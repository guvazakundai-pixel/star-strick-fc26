import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireClubManager } from "@/lib/route-auth";
import { z } from "zod";

const ActivitySchema = z.object({
  type: z.enum([
    "MATCH_RESULT", "NEW_SIGNING", "TOURNAMENT_WIN",
    "RIVALRY_UPDATE", "ANNOUNCEMENT", "MVP_HIGHLIGHT",
    "ACHIEVEMENT", "MEMBER_JOINED", "CLUB_CREATED",
  ]),
  message: z.string().min(1).max(500),
  metadata: z.any().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const limit = parseInt(new URL(_req.url).searchParams.get("limit") ?? "20", 10);

  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activity = await prisma.clubActivity.findMany({
    where: { clubId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ activity });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const membership = await prisma.clubMember.findFirst({
    where: { userId: auth.session.userId, clubId, status: "APPROVED" },
    select: { role: true },
  });

  if (!membership || !["OWNER", "MANAGER", "CAPTAIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Only club management can post activity" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.clubActivity.create({
    data: {
      clubId,
      userId: auth.session.userId,
      type: parsed.data.type,
      message: parsed.data.message,
      metadata: parsed.data.metadata || {},
    },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ activity: entry }, { status: 201 });
}
